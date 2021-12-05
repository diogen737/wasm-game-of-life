mod utils;

use wasm_bindgen::prelude::*;
// use utils::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
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
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Universe {

    // =================================================================
    // Public methods
    // =================================================================

    pub fn new() -> Universe {
        // set_panic_hook();

        let width = 64;
        let height = 64;

        let cells = (0..width * height)
            .map(|_| {
            // .map(|i| {
                // c/4 diagonal initialization
                // if [1, 66, 128, 129, 130].contains(&i) {
                //     Cell::Alive
                // } else {
                //     Cell::Dead
                // }
                // random field initialization
                if js_sys::Math::random() > 0.5 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();

        Universe {
            width,
            height, 
            cells
        }
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbors_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    _ => cell
                };

                next[idx] = next_cell;
            }
        }

        self.cells = next;
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        // Resets all cells to the dead state.
        self.cells = (0..width * self.height).map(|_| Cell::Dead).collect();
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        // Resets all cells to the dead state.
        self.cells = (0..self.width * height).map(|_| Cell::Dead).collect();
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn get_index(&self, row: u32, col: u32) -> usize {
        (row * self.width + col) as usize
    }

    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells[idx].toggle();
    }

    pub fn spawn_glider(&mut self, row: u32, col: u32) {
        log!("spawning at {} - {}", row, col);
        self.set_cells(&[
            (row, col - 1),
            (row + 1, col),
            (row - 1, col + 1),
            (row, col + 1),
            (row + 1, col + 1)
        ]);
    }

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

    // =================================================================
    // Private service methods
    // =================================================================

    fn live_neighbors_count(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 1, 0].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (col + delta_col) % self.width;
                let neighbor_idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[neighbor_idx] as u8;
            }
        }
        count
    }
}

// methods for internal testing, not exposing them to the JS code

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