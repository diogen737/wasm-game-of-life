//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_game_of_life;
extern crate wasm_bindgen_test;
use  wasm_game_of_life::{Universe, Cell};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

// =============================================
// pre-configured universes
// =============================================

#[cfg(test)]
pub fn input_glider() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells(&[(1, 2), (2, 3), (3, 1), (3, 2), (3, 3)]);
    universe
}

#[cfg(test)]
pub fn expected_glider_one_tick() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells(&[(2, 1), (2, 3), (3, 2), (3, 3), (4, 2)]);
    universe
}

#[cfg(test)]
pub fn expected_glider_ten_ticks_compact() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells(&[(0, 4), (0, 5), (4, 5), (5, 3), (5, 5)]);
    universe
}

#[cfg(test)]
pub fn expected_glider_ten_ticks_flat() -> Universe {
    let mut universe = Universe::new(6, 6);
    universe.set_cells(&[(4, 5), (5, 4), (5, 5)]);
    universe
}

// =============================================
// universe tests
// =============================================

#[wasm_bindgen_test]
pub fn set_cells_compact() {
    let mut universe = Universe::new(3, 3);
    universe.set_cells(&[(1, 1), (3, 3)]);

    assert_eq!(universe.size(), 9);

    // (3, 3) wraps to (0, 0)
    assert_eq!(universe.get_cell(0, 0), Cell::Alive);
    assert_eq!(universe.get_cell(0, 1), Cell::Dead);
    assert_eq!(universe.get_cell(0, 2), Cell::Dead);

    assert_eq!(universe.get_cell(1, 0), Cell::Dead);
    assert_eq!(universe.get_cell(1, 1), Cell::Alive);
    assert_eq!(universe.get_cell(1, 2), Cell::Dead);

    assert_eq!(universe.get_cell(2, 0), Cell::Dead);
    assert_eq!(universe.get_cell(2, 1), Cell::Dead);
    assert_eq!(universe.get_cell(2, 2), Cell::Dead);
}

#[wasm_bindgen_test]
pub fn set_cells_flat() {
    let mut universe = Universe::new(3, 3);
    universe.set_compact(false);
    universe.set_cells(&[(1, 1), (3, 3)]);

    // (3, 3) disappears into void
    assert_eq!(universe.get_cell(0, 0), Cell::Dead);
    assert_eq!(universe.get_cell(0, 1), Cell::Dead);
    assert_eq!(universe.get_cell(0, 2), Cell::Dead);

    assert_eq!(universe.get_cell(1, 0), Cell::Dead);
    assert_eq!(universe.get_cell(1, 1), Cell::Alive);
    assert_eq!(universe.get_cell(1, 2), Cell::Dead);

    assert_eq!(universe.get_cell(2, 0), Cell::Dead);
    assert_eq!(universe.get_cell(2, 1), Cell::Dead);
    assert_eq!(universe.get_cell(2, 2), Cell::Dead);
}

#[wasm_bindgen_test]
pub fn one_tick_compact() {
    let mut input_universe = input_glider();
    let expected_universe = expected_glider_one_tick();

    input_universe.tick();
    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}

#[wasm_bindgen_test]
pub fn ten_ticks_compact() {
    let mut input_universe = input_glider();
    let expected_universe = expected_glider_ten_ticks_compact();

    for _ in 0..10 {
        input_universe.tick();
    }

    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}

#[wasm_bindgen_test]
pub fn ten_ticks_flat() {
    let mut input_universe = input_glider();
    input_universe.set_compact(false);
    let expected_universe = expected_glider_ten_ticks_flat();

    for _ in 0..10 {
        input_universe.tick();
    }

    assert_eq!(&input_universe.get_cells(), &expected_universe.get_cells());
}
