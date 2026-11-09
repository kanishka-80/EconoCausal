# EconoCausal — Week 3 Day 2 Report

**Owner:** Khushi Tyagi  
**Role:** Frontend Developer  
**Date:** 30 October 2026  
**Branch:** khushi-work

## Objective
Improve the budget and constraint form according to the shared API contract.

## Completed Work
- Added an optimization objective selector.
- Added MAXIMIZE_UPLIFT and MAXIMIZE_REVENUE options.
- Retained positive budget validation.
- Validated allowed discount values: 0, 5, 10, 20.
- Added duplicate discount validation.
- Retained customer ID column selection and validation.
- Added loading and error feedback.
- Displayed allocation results in a structured table.
- Added explicit insufficient-budget result messaging.
- Preserved mock/scaffold output warnings.
- Avoided assuming a currency because the contract does not specify one.

## Validation
- ESLint and production build are included in the Day 2 verification.
- Backend optimization behavior still depends on backend availability and solver readiness.

## Day 2 Outcome
The budget allocation form now supports both contract-defined objectives
and presents returned allocation rows in a structured table.
