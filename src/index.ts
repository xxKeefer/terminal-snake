import TK, { Terminal, ScreenBuffer } from 'terminal-kit'

type GameState = {
    snake: Snake
    game: Game
}

type Snake = {
    position: Coords
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
    },
    game: {
        playing: true,
        max: {
            x: 0,
            y: 0,
        },
    },
}

const DIRECTIONS = Object.freeze({
    UP: ['W', 'w', 'UP'] as const,
    DOWN: ['S', 's', 'DOWN'] as const,
    LEFT: ['A', 'a', 'LEFT'] as const,
    RIGHT: ['D', 'd', 'RIGHT'] as const,
})

type DirectionalInput = (typeof DIRECTIONS)[keyof typeof DIRECTIONS][number]
type CommandInput = 'CTRL_C'
type ExpectedInput = DirectionalInput | CommandInput

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
            updates = handleControls(name, updates)
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

    const { snake } = state
    screen.put(
        {
            y: snake.position.y,
            x: snake.position.x,
            dy: 0,
            dx: 0,
            wrap: true,
            attr: { color: 'green', bgColor: 'green' },
        },
        ' ',
    )
    screen.draw({ delta: true })
    setTimeout(() => render(screen, state), 50)
}

/**
 * TODO
 *  - split up code
 *  - more sophisticated snake
 *    - constant moove
 *  - add food
 *  - make the long boi
 *  - handle snek collision
 *  - title screen
 *  - score
 *  - high score in external txt doc
 */

function handleControls(input: DirectionalInput, state: GameState): GameState {
    if (DIRECTIONS.DOWN.some((dir) => dir === input)) {
        const next = state.snake.position.y + 1
        const checked = next >= state.game.max.y ? 0 : next
        state.snake.position.y = checked
    }
    if (DIRECTIONS.UP.some((dir) => dir === input)) {
        const next = state.snake.position.y - 1
        const checked = next < 0 ? state.game.max.y - 1 : next
        state.snake.position.y = checked
    }
    if (DIRECTIONS.RIGHT.some((dir) => dir === input)) {
        const next = state.snake.position.x + 1
        const checked = next >= state.game.max.x ? 0 : next
        state.snake.position.x = checked
    }
    if (DIRECTIONS.LEFT.some((dir) => dir === input)) {
        const next = state.snake.position.x - 1
        const checked = next < 0 ? state.game.max.x - 1 : next
        state.snake.position.x = checked
    }
    return state
}

function exit(terminal: Terminal) {
    terminal.grabInput(false)
    terminal.reset()
    setTimeout(function () {
        process.exit()
    }, 100)
}

main(render, INITIAL_STATE)
