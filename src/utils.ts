import { Coords, GameState } from './types.js'

function detectCollision(entity: Coords, target: Coords): boolean {
    const sameX = entity.x === target.x
    const sameY = entity.y === target.y
    return sameX && sameY
}

function randomLocation(bounds: Coords): Coords {
    return {
        x: Math.floor(Math.random() * (bounds.x + 1)),
        y: Math.floor(Math.random() * (bounds.y + 1)),
    }
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

export { detectCollision, randomLocation, initialiseState }
