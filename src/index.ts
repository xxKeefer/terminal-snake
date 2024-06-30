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
 *  - title screen
 *  - difficulty select
 *     - snek speed
 *  - score
 *  - high score in external txt doc
 *  - normalise snek sped on vertical vs horizontal
 */

function main(render: (terminal: TK.Terminal, state: GameState) => void) {
    TK.getDetectedTerminal((error, terminal) => {
        if (error) throw new Error('Cannot detect terminal.')

        const state = initialiseState({
            x: terminal.width,
            y: terminal.height - 1,
        })

        terminal.hideCursor()
        terminal.grabInput(true)

        terminal.on('key', (name: ExpectedInput) => {
            if (name === 'CTRL_C') {
                exit(terminal)
                return
            }

            state.snake = handleControls(name, state.snake)
        })

        render(terminal, state)
    })
}

function render(terminal: Terminal, state: GameState) {
    // exit if collision with self
    if (detectSnakeCollision(state.snake)) exit(terminal)

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
    if (eaten) state.food.position = randomLocation(state.game.max)

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

function detectSnakeCollision(snake: Snake): boolean {
    return snake.tail
        .slice(0, -1)
        .some((segment) => detectCollision(snake.position, segment))
}

function randomLocation(bounds: Coords): Coords {
    return {
        x: Math.floor(Math.random() * (bounds.x + 1)),
        y: Math.floor(Math.random() * (bounds.y + 1)),
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

function initialiseState(bounds: Coords): GameState {
    const snakePosition = randomLocation(bounds)
    let foodPosition = randomLocation(bounds)

    const directions = ['DOWN', 'UP', 'LEFT', 'RIGHT'] as const
    const direction = directions[Math.floor(Math.random() * directions.length)]

    while (detectCollision(snakePosition, foodPosition)) {
        foodPosition = randomLocation(bounds)
    }

    return {
        food: {
            position: foodPosition,
        },
        snake: {
            position: snakePosition,
            direction,
            tail: [snakePosition],
        },
        game: {
            max: bounds,
            playing: true,
        },
    }
}

main(render)
