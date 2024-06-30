import { Direction, DirectionalInput, GameState, Snake } from './types.js'
import { detectCollision } from './utils.js'

function detectSnakeCollision(snake: Snake): boolean {
    return snake.tail
        .slice(0, -1)
        .some((segment) => detectCollision(snake.position, segment))
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

export { detectSnakeCollision, handleControls, handleMove }
