// Debug script to test pathfinder
const { Pathfinder } = require('../../dist/world/Pathfinder');
const { Tile, TileType } = require('../../dist/world/TileSystem');

// Create 5x5 grid with water barrier at col 2
const grid = [];
for (let row = 0; row < 5; row++) {
    grid[row] = [];
    for (let col = 0; col < 5; col++) {
        const type = col === 2 ? TileType.WATER : TileType.GRASS;
        const tile = new Tile(col, row, type);
        grid[row][col] = tile.toData();
    }
}

console.log('Grid (G=grass, W=water):');
for (let row = 0; row < 5; row++) {
    let line = '';
    for (let col = 0; col < 5; col++) {
        line += grid[row][col].type === TileType.WATER ? 'W ' : 'G ';
    }
    console.log(`Row ${row}: ${line}`);
}

const pathfinder = new Pathfinder();
console.log('\nFinding path from (0,2) to (4,2)...');
console.log('Diagonal movement:', pathfinder['allowDiagonal']);

const path = pathfinder.findPath(0, 2, 4, 2, grid);

if (path) {
    console.log('\nPath found:');
    path.forEach((node, i) => {
        console.log(`  ${i}: (${node.col}, ${node.row})`);
    });
} else {
    console.log('\nNo path found!');
}
