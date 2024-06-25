import TK, { Terminal, ScreenBuffer } from 'terminal-kit'

type ValuesOf<T> = T[keyof T]

type GameState = {
    snake: Snake
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

function main(
    render: (screen: TK.ScreenBuffer, state: GameState) => void,
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

        const screen = new TK.ScreenBuffer({
            dst: terminal,
            width: WIDTH,
            height: HEIGHT,
        })

        render(screen, updates)
    })
}

function render(screen: ScreenBuffer, state: GameState) {
    screen.fill({ attr: { bgColor: 'black' } })

    if (state.snake.tail.length < 10) {
        state.snake = handleEat(state.snake)
    }

    state = handleMove(state)

    state.snake.tail.forEach(({ x, y }) => {
        screen.put(
            {
                y,
                x,
                dy: 0,
                dx: 0,
                wrap: true,
                attr: { color: 'green', bgColor: 'green' },
            },
            ' ',
        )
    })

    screen.draw({ delta: true })
    setTimeout(() => render(screen, state), 50)
}

/**
 * TODO
 *  - split up code
 *  - more sophisticated snake
 *    - randomise start position
 *  - add food
 *  - make the long boi
 *  - handle snek collision
 *  - title screen
 *  - dificulty select
 *     - snek speed
 *  - score
 *  - high score in external txt doc
 */

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
function handleMove(state: GameState): GameState {
    if (state.snake.direction === 'DOWN') {
        const next = state.snake.position.y + 1
        const checked = next >= state.game.max.y ? 0 : next
        state.snake.position.y = checked
    }
    if (state.snake.direction === 'UP') {
        const next = state.snake.position.y - 1
        const checked = next < 0 ? state.game.max.y - 1 : next
        state.snake.position.y = checked
    }
    if (state.snake.direction === 'RIGHT') {
        const next = state.snake.position.x + 1
        const checked = next >= state.game.max.x ? 0 : next
        state.snake.position.x = checked
    }
    if (state.snake.direction === 'LEFT') {
        const next = state.snake.position.x - 1
        const checked = next < 0 ? state.game.max.x - 1 : next
        state.snake.position.x = checked
    }

    state.snake.tail = [...state.snake.tail, state.snake.position].slice(1)

    return state
}

function handleEat(snake: Snake): Snake {
    snake.tail = [...snake.tail, snake.position]
    return snake
}

function exit(terminal: Terminal) {
    terminal.grabInput(false)
    terminal.reset()
    setTimeout(function () {
        process.exit()
    }, 100)
}

main(render, INITIAL_STATE)
