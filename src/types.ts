export type ValuesOf<T> = T[keyof T]

export type GameState = {
    snake: Snake
    food: Food
    game: Game
}

export type Snake = {
    position: Coords
    tail: Coords[]
    direction: Cardinals
}

export type Game = {
    playing: boolean
    max: Coords
}

export type Food = {
    position: Coords
}

export type Coords = {
    x: number
    y: number
}

export const Cardinal = Object.freeze({
    Up: 'UP',
    Down: 'DOWN',
    Left: 'LEFT',
    Right: 'RIGHT',
})

export type Cardinals = ValuesOf<typeof Cardinal>

export const Direction = Object.freeze({
    [Cardinal.Up]: ['W', 'w', 'UP'] as const,
    [Cardinal.Down]: ['S', 's', 'DOWN'] as const,
    [Cardinal.Left]: ['A', 'a', 'LEFT'] as const,
    [Cardinal.Right]: ['D', 'd', 'RIGHT'] as const,
})

export type DirectionalInput = ValuesOf<typeof Direction>[number]
export type ExitInput = 'CTRL_C'
export type ExpectedInput = DirectionalInput | ExitInput
