import TK, { Terminal, ScreenBuffer } from 'terminal-kit'

type ValuesOf<T> = T[keyof T]

type GameState = {
    snake: Snake
    food: Food
    game: Game
}

type Snake = {
    position: Coords
    tail: Coords[]
    direction: Cardinals
}

type Game = {
    playing: boolean
    max: Coords
}

type Food = {
    position: Coords
}

type Coords = {
    x: number
    y: number
}

const INITIAL_STATE: GameState = {
    snake: {
        position: {
            x: 0,
            y: 0,
        },
        tail: [
            {
                x: 0,
                y: 0,
            },
        ],
        direction: 'RIGHT',
    },
    food: {
        position: { x: 0, y: 0 },
    },
    game: {
        playing: true,
        max: {
            x: 0,
            y: 0,
        },
    },
}

const Cardinal = Object.freeze({
    Up: 'UP',
    Down: 'DOWN',
    Left: 'LEFT',
    Right: 'RIGHT',
})

type Cardinals = ValuesOf<typeof Cardinal>

const Direction = Object.freeze({
    [Cardinal.Up]: ['W', 'w', 'UP'] as const,
    [Cardinal.Down]: ['S', 's', 'DOWN'] as const,
    [Cardinal.Left]: ['A', 'a', 'LEFT'] as const,
    [Cardinal.Right]: ['D', 'd', 'RIGHT'] as const,
})

type DirectionalInput = ValuesOf<typeof Direction>[number]
type ExitInput = 'CTRL_C'
type ExpectedInput = DirectionalInput | ExitInput

/**
 * TODO
 *  - debug mode
 *  - split up code
 *  - more sophisticated snake
 *    - randomise start position
 *  - handle snek collision
 *  - title screen
 *  - difficulty select
 *     - snek speed
 *  - score
 *  - high score in external txt doc
 */

function main(
    render: (terminal: TK.Terminal, state: GameState) => void,
    initialise: GameState,
) {
    TK.getDetectedTerminal((error, terminal) => {
        if (error) throw new Error('Cannot detect terminal.')
        const WIDTH = terminal.width
        const HEIGHT = terminal.height - 1

        let updates = {
            ...initialise,
            game: {
                ...initialise.game,
                max: {
                    x: WIDTH,
                    y: HEIGHT,
                },
            },
        }

        terminal.hideCursor()
        terminal.grabInput(true)

        terminal.on('key', (name: ExpectedInput) => {
            if (name === 'CTRL_C') {
                exit(terminal)
                return
            }

            updates.snake = handleControls(name, updates.snake)
        })

        render(terminal, updates)
    })
}

function render(terminal: Terminal, state: GameState) {
    const view = new TK.ScreenBuffer({
        dst: terminal,
        width: terminal.width,
        height: terminal.height,
    })
    view.fill({ attr: { color: 'white', bgColor: 'black' } })
    const DEBUG_HEIGHT = 5
    renderDebug(view, state, DEBUG_HEIGHT)
    renderGame(view, state, DEBUG_HEIGHT)

    view.draw({ delta: true })
    setTimeout(() => render(terminal, state), 50)
}

function renderDebug(view: ScreenBuffer, state: GameState, height: number) {
    const debug = new TK.ScreenBuffer({
        dst: view,
        width: view.width,
        height: height,
    })
    debug.fill({ attr: { color: 'black', bgColor: 'yellow' } })
    debug.put(
        {
            y: 0,
            x: 0,
            dy: 0,
            dx: 1,
            wrap: true,
            attr: { color: 'black', bgColor: 'yellow' },
        },
        JSON.stringify(state, null, 0),
    )
    debug.draw({ dst: view, x: 0, y: 0, blending: true })
}

function renderGame(view: ScreenBuffer, state: GameState, height: number) {
    const game = new TK.ScreenBuffer({
        dst: view,
        width: view.width,
        height: view.height - height,
    })
    game.fill({ attr: { color: 'white', bgColor: 'transparent' } })

    const eaten = detectCollision(state.snake.position, state.food.position)
    state = handleMove(state, eaten)
    if (eaten) state.food.position = randomLocation(game)

    state.snake.tail.forEach(({ x, y }) => {
        game.put(
            {
                y,
                x,
                dy: 0,
                dx: 0,
                wrap: true,
                attr: { color: 'green', bgColor: 'transparent' },
            },
            '*',
        )
    })
    game.put(
        {
            x: state.food.position.x,
            y: state.food.position.y,
            dy: 0,
            dx: 0,
            wrap: true,
            attr: { color: 'red', bgColor: 'transparent' },
        },
        '*',
    )

    game.draw({ dst: view, x: 0, y: height, blending: true })
}

function detectCollision(entity: Coords, target: Coords): boolean {
    const sameX = entity.x === target.x
    const sameY = entity.y === target.y
    return sameX && sameY
}

function randomLocation(area: ScreenBuffer): Coords {
    return {
        x: Math.floor(Math.random() * (area.width + 1)),
        y: Math.floor(Math.random() * (area.height + 1)),
    }
}

function handleControls(input: DirectionalInput, snake: Snake): Snake {
    if (
        Direction.DOWN.some((dir) => dir === input) &&
        snake.direction !== 'UP'
    ) {
        snake.direction = 'DOWN'
    }
    if (
        Direction.UP.some((dir) => dir === input) &&
        snake.direction !== 'DOWN'
    ) {
        snake.direction = 'UP'
    }
    if (
        Direction.RIGHT.some((dir) => dir === input) &&
        snake.direction !== 'LEFT'
    ) {
        snake.direction = 'RIGHT'
    }
    if (
        Direction.LEFT.some((dir) => dir === input) &&
        snake.direction !== 'RIGHT'
    ) {
        snake.direction = 'LEFT'
    }
    return snake
}
function handleMove(state: GameState, eat: boolean): GameState {
    if (state.snake.direction === 'DOWN') {
        const update = state.snake.position.y + 1
        const checked = update >= state.game.max.y ? 0 : update
        state.snake.position.y = checked
    }
    if (state.snake.direction === 'UP') {
        const update = state.snake.position.y - 1
        const checked = update < 0 ? state.game.max.y - 1 : update
        state.snake.position.y = checked
    }
    if (state.snake.direction === 'RIGHT') {
        const update = state.snake.position.x + 1
        const checked = update >= state.game.max.x ? 0 : update
        state.snake.position.x = checked
    }
    if (state.snake.direction === 'LEFT') {
        const update = state.snake.position.x - 1
        const checked = update < 0 ? state.game.max.x - 1 : update
        state.snake.position.x = checked
    }

    if (!eat) state.snake.tail.shift()
    state.snake.tail.push({ ...state.snake.position })

    return state
}

function exit(terminal: Terminal) {
    terminal.grabInput(false)
    terminal.reset()
    setTimeout(() => {
        process.exit()
    }, 100)
}

main(render, INITIAL_STATE)
