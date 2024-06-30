import TK, { Terminal, ScreenBuffer } from 'terminal-kit'
import { ExpectedInput, GameState } from './types.js'

import { handleControls, detectSnakeCollision, handleMove } from './snake.js'
import { initialiseState, detectCollision, randomLocation } from './utils.js'

/**
 * TODO
 *  - debug mode
 *  - title screen
 *  - difficulty select
 *     - snek speed
 *  - score
 *  - high score in external txt doc
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

function exit(terminal: Terminal) {
    terminal.grabInput(false)
    terminal.reset()
    setTimeout(() => {
        process.exit()
    }, 100)
}

main(render)
