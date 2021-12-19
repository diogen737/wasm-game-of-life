// #![feature(test)]
// mod utils;
// extern crate test;
// use utils::Timer;

use wasm_bindgen::prelude::*;

// when the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead
        };
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    /**
     * double-buffered univerese state, vectors are allocated only once upon the universe creation
     */
    cells: Vec<Cell>,
    cells_next: Vec<Cell>,
    /**
     * indices of cells that has changed their state in the next tick
     */
    cells_diff: Vec<usize>
}

#[wasm_bindgen]
impl Universe {

    /**
     * public methods
     */

    pub fn new(width: u32, height: u32) -> Universe {
        let cells: Vec<Cell> = (0..width * height)
            .map(|_| Cell::Dead)
            .collect();

        let cells_next = cells.clone();
        let cells_diff = Vec::new();

        Universe {
            width,
            height, 
            cells,
            cells_next,
            cells_diff
        }
    }

    pub fn tick(&mut self) {
        // calculate next generation
        self.cells_diff.clear();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbors_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // all other cells remain in the same state.
                    _ => cell
                };

                self.cells_next[idx] = next_cell;

                // add new cell to the diff if it's changed in the next gen
                if next_cell != cell {
                    self.cells_diff.push(idx);
                }
            }
        }

        // copy new state into 'cells'
        for (i, &cell) in self.cells_next.iter().enumerate() {
            self.cells[i] = cell;
        }
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn cells_diff(&self) -> *const usize {
        self.cells_diff.as_ptr()
    }

    pub fn cells_diff_len(&self) -> usize {
        self.cells_diff.len()
    }

    pub fn get_index(&self, row: u32, col: u32) -> usize {
        (row * self.width + col) as usize
    }

    /**
     * private service methods
     */

    fn live_neighbors_count(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;

        let north = if row == 0 {
            self.height - 1
        } else {
            row - 1 
        };

        let south = if row == self.height - 1 {
            0
        } else {
            row + 1
        };

        let east = if col == 0 {
            self.width - 1
        } else {
            col - 1
        };

        let west = if col == self.width - 1 {
            0
        } else {
            col + 1
        };

        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;

        let e = self.get_index(row, east);
        count += self.cells[e] as u8;

        let se = self.get_index(south, east);
        count += self.cells[se] as u8;

        let s = self.get_index(south, col);
        count += self.cells[s] as u8;

        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;

        let w = self.get_index(row, west);
        count += self.cells[w] as u8;

        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;

        let n = self.get_index(north, col);
        count += self.cells[n] as u8;

        count
    }
}

/**
 * explicit changes in the universe
 */
#[wasm_bindgen]
impl Universe {
    /**
     * toggle particular cell
     */
    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells[idx].toggle();
        self.cells_diff.push(idx);
    }

    /**
     * reset all cell to dead
     */
    pub fn set_all_dead(&mut self) {
        self.cells_diff.clear();
        for (i, cell) in self.cells.iter_mut().enumerate() {
            *cell = Cell::Dead;
            self.cells_diff.push(i);
        }
    }

    /**
     * set each cell to a random state
     */
    pub fn set_random(&mut self) {
        self.cells_diff.clear();
        for (i, cell) in self.cells.iter_mut().enumerate() {
            *cell = if js_sys::Math::random() > 0.5 {
                Cell::Alive
            } else {
                Cell::Dead
            };
            self.cells_diff.push(i);
        }
    }

    /**
     * c/4 diagonal glider
     * https://www.conwaylife.com/wiki/C/4_diagonal
     */
    pub fn spawn_glider(&mut self, row: u32, col: u32) {
        self.set_cells(&[
            (row, col - 1),
            (row + 1, col),
            (row - 1, col + 1),
            (row, col + 1),
            (row + 1, col + 1)
        ]);
    }

    /**
     * pulsar
     * https://www.conwaylife.com/wiki/Pulsar
     */
    pub fn spawn_pulsar(&mut self, row: u32, col: u32) {
        self.set_cells(&[
            // outer rim
            (row - 6, col - 4),
            (row - 6, col - 3),
            (row - 6, col - 2),
            (row - 6, col + 2),
            (row - 6, col + 3),
            (row - 6, col + 4),

            (row + 6, col - 4),
            (row + 6, col - 3),
            (row + 6, col - 2),
            (row + 6, col + 2),
            (row + 6, col + 3),
            (row + 6, col + 4),

            (row - 4, col - 6),
            (row - 3, col - 6),
            (row - 2, col - 6),
            (row - 4, col + 6),
            (row - 3, col + 6),
            (row - 2, col + 6),

            (row + 4, col - 6),
            (row + 3, col - 6),
            (row + 2, col - 6),
            (row + 4, col + 6),
            (row + 3, col + 6),
            (row + 2, col + 6),

            // inner arms
            (row - 1, col - 4),
            (row - 1, col - 3),
            (row - 1, col - 2),
            (row - 1, col + 2),
            (row - 1, col + 3),
            (row - 1, col + 4),

            (row + 1, col - 4),
            (row + 1, col - 3),
            (row + 1, col - 2),
            (row + 1, col + 2),
            (row + 1, col + 3),
            (row + 1, col + 4),

            (row + 4, col - 1),
            (row + 3, col - 1),
            (row + 2, col - 1),
            (row + 4, col + 1),
            (row + 3, col + 1),
            (row + 2, col + 1),

            (row - 4, col - 1),
            (row - 3, col - 1),
            (row - 2, col - 1),
            (row - 4, col + 1),
            (row - 3, col + 1),
            (row - 2, col + 1),
        ]);
    }
}


/**
 * methods for internal testing, not exposing them to the JS code
 */
impl Universe {
    pub fn get_cells(&self) -> &[Cell] {
        &self.cells
    }

    pub fn set_cells(&mut self, new_cells: &[(u32, u32)]) {
        for (row, col) in new_cells.iter().cloned() {
            let row = (row + self.height) % self.height;
            let col = (col + self.width) % self.width;
            let idx = self.get_index(row, col);
            self.cells[idx] = Cell::Alive;
        }
    }
}


// #[bench]
// fn universe_ticks(b: &mut test::Bencher) {
//     let mut universe = Universe::new(300, 300);

//     b.iter(|| {
//         universe.tick();
//     });
// }
