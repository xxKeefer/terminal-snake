import TK, { Terminal, ScreenBuffer } from 'terminal-kit'

type GameState = {
    snake: Snake
}

type Snake = {
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
    },
}

const DIRECTIONS = Object.freeze({
    UP: ['W', 'w', 'UP'],
    DOWN: ['S', 's', 'DOWN'],
    LEFT: ['A', 'a', 'LEFT'],
    RIGHT: ['D', 'd', 'RIGHT'],
})

function main(
    render: (screen: TK.ScreenBuffer, state: GameState) => void,
    initialise: GameState,
) {
    TK.getDetectedTerminal((error, terminal) => {
        if (error) throw new Error('Cannot detect terminal.')

        let updates = initialise

        terminal.hideCursor()
        terminal.grabInput(true)

        terminal.on('key', (name: string) => {
            if (name === 'CTRL_C') {
                exit(terminal)
            }
            updates = handleControls(name, updates)
        })

        const screen = new TK.ScreenBuffer({
            dst: terminal,
            width: terminal.width,
            height: terminal.height - 1,
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
            attr: { color: 'green', bgColor: 'black' },
        },
        '!',
    )
    screen.draw({ delta: true })
    setTimeout(() => render(screen, state), 50)
}

function handleControls(input: string, state: GameState): GameState {
    if (DIRECTIONS.UP.includes(input)) {
        state.snake.position.y -= 1
    }
    if (DIRECTIONS.DOWN.includes(input)) {
        state.snake.position.y += 1
    }
    if (DIRECTIONS.RIGHT.includes(input)) {
        state.snake.position.x += 1
    }
    if (DIRECTIONS.LEFT.includes(input)) {
        state.snake.position.x -= 1
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
