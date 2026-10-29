import type { CurriculumSubject, CurriculumTopic } from './types';

/**
 * NERDC-aligned General Mathematics topics for Nigerian
 * Primary (1–6), Junior Secondary (JSS 1–3), and Senior Secondary (SS 1–3).
 * Themes follow the 9-year Basic Education Curriculum and Senior Secondary
 * General Mathematics structure from NERDC / NAPPS schemes of work.
 */
const topics: CurriculumTopic[] = [
  // ─── Primary 1 ───────────────────────────────────────────────
  { id: 'p1-wn-1-5', title: 'Whole Numbers 1–5', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-wn-zero', title: 'Whole Number 0 (Zero)', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-wn-6-9', title: 'Whole Numbers 6–9', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-wn-10', title: 'Whole Number 10', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-wn-1-99', title: 'Whole Numbers 1–99', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-fractions', title: 'Fractions (Introduction)', theme: 'Number and Numeration', classes: ['primary-1'] },
  { id: 'p1-addition-i', title: 'Addition I', theme: 'Basic Operations', classes: ['primary-1'] },
  { id: 'p1-subtraction-i', title: 'Subtraction I', theme: 'Basic Operations', classes: ['primary-1'] },
  { id: 'p1-addition-ii', title: 'Addition II', theme: 'Basic Operations', classes: ['primary-1'] },
  { id: 'p1-subtraction-ii', title: 'Subtraction II', theme: 'Basic Operations', classes: ['primary-1'] },
  { id: 'p1-open-sentences', title: 'Open Sentences', theme: 'Algebraic Processes', classes: ['primary-1'] },
  { id: 'p1-money', title: 'Money', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-2d-shapes', title: 'Two-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-1'] },
  { id: 'p1-data', title: 'Data Collection', theme: 'Everyday Statistics', classes: ['primary-1'] },

  // ─── Primary 2 ───────────────────────────────────────────────
  { id: 'p2-whole-numbers', title: 'Whole Numbers up to 200', theme: 'Number and Numeration', classes: ['primary-2'] },
  { id: 'p2-fractions', title: 'Fractions (Halves and Quarters)', theme: 'Number and Numeration', classes: ['primary-2'] },
  { id: 'p2-addition', title: 'Addition of 2-Digit Numbers', theme: 'Basic Operations', classes: ['primary-2'] },
  { id: 'p2-subtraction', title: 'Subtraction of 2-Digit Numbers', theme: 'Basic Operations', classes: ['primary-2'] },
  { id: 'p2-multiplication', title: 'Multiplication (Introduction)', theme: 'Basic Operations', classes: ['primary-2'] },
  { id: 'p2-division', title: 'Division (Sharing)', theme: 'Basic Operations', classes: ['primary-2'] },
  { id: 'p2-open-sentences', title: 'Open Sentences', theme: 'Algebraic Processes', classes: ['primary-2'] },
  { id: 'p2-money', title: 'Money', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-capacity', title: 'Capacity', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-area', title: 'Area (Introduction)', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-2d-shapes', title: 'Two-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-2'] },
  { id: 'p2-data', title: 'Data Collection and Presentation', theme: 'Everyday Statistics', classes: ['primary-2'] },

  // ─── Primary 3 ───────────────────────────────────────────────
  { id: 'p3-whole-numbers', title: 'Whole Numbers up to 999', theme: 'Number and Numeration', classes: ['primary-3'] },
  { id: 'p3-fractions', title: 'Fractions', theme: 'Number and Numeration', classes: ['primary-3'] },
  { id: 'p3-addition', title: 'Addition', theme: 'Basic Operations', classes: ['primary-3'] },
  { id: 'p3-subtraction', title: 'Subtraction', theme: 'Basic Operations', classes: ['primary-3'] },
  { id: 'p3-multiplication', title: 'Multiplication', theme: 'Basic Operations', classes: ['primary-3'] },
  { id: 'p3-division', title: 'Division', theme: 'Basic Operations', classes: ['primary-3'] },
  { id: 'p3-open-sentences', title: 'Open Sentences', theme: 'Algebraic Processes', classes: ['primary-3'] },
  { id: 'p3-money', title: 'Money', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-length-ii', title: 'Length II', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-capacity', title: 'Capacity', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-symmetry', title: 'Symmetry', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-2d-shapes', title: 'Two-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-3'] },
  { id: 'p3-data', title: 'Data Collection and Pictograms', theme: 'Everyday Statistics', classes: ['primary-3'] },

  // ─── Primary 4 ───────────────────────────────────────────────
  { id: 'p4-whole-numbers', title: 'Whole Numbers up to 1,000,000', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-roman', title: 'Roman Numerals (I–M)', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-lcm', title: 'Lowest Common Multiple (LCM)', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-hcf', title: 'Highest Common Factor (HCF)', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-fractions', title: 'Fractions and Equivalent Fractions', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-decimals', title: 'Decimal Fractions', theme: 'Number and Numeration', classes: ['primary-4'] },
  { id: 'p4-addition-subtraction', title: 'Addition and Subtraction', theme: 'Basic Operations', classes: ['primary-4'] },
  { id: 'p4-multiplication', title: 'Multiplication', theme: 'Basic Operations', classes: ['primary-4'] },
  { id: 'p4-division', title: 'Division', theme: 'Basic Operations', classes: ['primary-4'] },
  { id: 'p4-estimate', title: 'Estimation', theme: 'Basic Operations', classes: ['primary-4'] },
  { id: 'p4-open-sentences', title: 'Open Sentences', theme: 'Algebraic Processes', classes: ['primary-4'] },
  { id: 'p4-money', title: 'Money', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-area', title: 'Area', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-capacity', title: 'Capacity', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-plane-shapes', title: 'Plane Shapes', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-4'] },
  { id: 'p4-bar-charts', title: 'Bar Charts and Pictograms', theme: 'Everyday Statistics', classes: ['primary-4'] },

  // ─── Primary 5 ───────────────────────────────────────────────
  { id: 'p5-whole-numbers', title: 'Whole Numbers and Place Value', theme: 'Number and Numeration', classes: ['primary-5'] },
  { id: 'p5-fractions', title: 'Fractions', theme: 'Number and Numeration', classes: ['primary-5'] },
  { id: 'p5-decimals', title: 'Decimals', theme: 'Number and Numeration', classes: ['primary-5'] },
  { id: 'p5-percentages', title: 'Percentages (Introduction)', theme: 'Number and Numeration', classes: ['primary-5'] },
  { id: 'p5-multiplication', title: 'Multiplication', theme: 'Basic Operations', classes: ['primary-5'] },
  { id: 'p5-division', title: 'Division', theme: 'Basic Operations', classes: ['primary-5'] },
  { id: 'p5-number-line', title: 'Number Line (Addition & Subtraction)', theme: 'Basic Operations', classes: ['primary-5'] },
  { id: 'p5-open-sentences', title: 'Open Sentences and Simple Equations', theme: 'Algebraic Processes', classes: ['primary-5'] },
  { id: 'p5-money', title: 'Money and Social Transactions', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-temperature', title: 'Temperature', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-area', title: 'Area', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-volume', title: 'Volume', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-capacity', title: 'Capacity', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-plane-shapes', title: 'Plane Shapes and Right Angles', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-circle', title: 'Circle', theme: 'Mensuration and Geometry', classes: ['primary-5'] },
  { id: 'p5-averages', title: 'Measures of Central Tendency', theme: 'Everyday Statistics', classes: ['primary-5'] },
  { id: 'p5-chance', title: 'Chance (Coins and Dice)', theme: 'Everyday Statistics', classes: ['primary-5'] },

  // ─── Primary 6 ───────────────────────────────────────────────
  { id: 'p6-whole-numbers', title: 'Whole Numbers and Demography', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-fractions', title: 'Fractions', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-ratios', title: 'Ratios and Proportions', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-percentages', title: 'Percentages', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-indices', title: 'Indices (Powers)', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-lcm-hcf', title: 'LCM and HCF', theme: 'Number and Numeration', classes: ['primary-6'] },
  { id: 'p6-multiplication', title: 'Multiplication', theme: 'Basic Operations', classes: ['primary-6'] },
  { id: 'p6-division', title: 'Division', theme: 'Basic Operations', classes: ['primary-6'] },
  { id: 'p6-order-ops', title: 'Order of Operations (BODMAS)', theme: 'Basic Operations', classes: ['primary-6'] },
  { id: 'p6-algebra', title: 'Simple Algebraic Expressions', theme: 'Algebraic Processes', classes: ['primary-6'] },
  { id: 'p6-money', title: 'Money, Population and Economics', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-currency', title: 'Conversion of Currencies', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-length', title: 'Length', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-weight', title: 'Weight', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-time', title: 'Time', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-perimeter', title: 'Perimeter', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-area', title: 'Area', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-volume', title: 'Volume', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-capacity', title: 'Capacity', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-speed', title: 'Speed', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-plane-shapes', title: 'Plane Shapes', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-3d-shapes', title: 'Three-Dimensional Shapes', theme: 'Mensuration and Geometry', classes: ['primary-6'] },
  { id: 'p6-statistics', title: 'Averages and Data Interpretation', theme: 'Everyday Statistics', classes: ['primary-6'] },
  { id: 'p6-probability', title: 'Simple Probability', theme: 'Everyday Statistics', classes: ['primary-6'] },

  // ─── JSS 1 ───────────────────────────────────────────────────
  { id: 'jss1-whole-numbers', title: 'Whole Numbers (Millions to Trillions)', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-lcm', title: 'Lowest Common Multiple (LCM)', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-hcf', title: 'Highest Common Factor (HCF)', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-base2-counting', title: 'Counting in Base 2', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-base2-conversion', title: 'Conversion of Base 10 to Binary', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-fractions', title: 'Fractions', theme: 'Number and Numeration', classes: ['jss-1'] },
  { id: 'jss1-add-sub', title: 'Addition and Subtraction', theme: 'Basic Operations', classes: ['jss-1'] },
  { id: 'jss1-frac-ops', title: 'Operations with Fractions', theme: 'Basic Operations', classes: ['jss-1'] },
  { id: 'jss1-estimation', title: 'Estimation', theme: 'Basic Operations', classes: ['jss-1'] },
  { id: 'jss1-approximation', title: 'Approximation', theme: 'Basic Operations', classes: ['jss-1'] },
  { id: 'jss1-base2-ops', title: 'Operations in Base 2', theme: 'Basic Operations', classes: ['jss-1'] },
  { id: 'jss1-symbols', title: 'Use of Symbols', theme: 'Algebraic Processes', classes: ['jss-1'] },
  { id: 'jss1-simplify', title: 'Simplification of Algebraic Expressions', theme: 'Algebraic Processes', classes: ['jss-1'] },
  { id: 'jss1-simple-eq', title: 'Simple Equations', theme: 'Algebraic Processes', classes: ['jss-1'] },
  { id: 'jss1-plane-shapes', title: 'Plane Shapes (Perimeter & Area)', theme: 'Mensuration and Geometry', classes: ['jss-1'] },
  { id: 'jss1-3d', title: 'Three-Dimensional Figures', theme: 'Mensuration and Geometry', classes: ['jss-1'] },
  { id: 'jss1-construction', title: 'Construction (Lines & Angles)', theme: 'Mensuration and Geometry', classes: ['jss-1'] },
  { id: 'jss1-angles', title: 'Angles', theme: 'Mensuration and Geometry', classes: ['jss-1'] },
  { id: 'jss1-stats-need', title: 'Need for Statistics', theme: 'Everyday Statistics', classes: ['jss-1'] },
  { id: 'jss1-data-collection', title: 'Data Collection', theme: 'Everyday Statistics', classes: ['jss-1'] },
  { id: 'jss1-data-presentation', title: 'Data Presentation', theme: 'Everyday Statistics', classes: ['jss-1'] },

  // ─── JSS 2 ───────────────────────────────────────────────────
  { id: 'jss2-large-small', title: 'Large and Small Numbers', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-standard-form', title: 'Standard Form', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-approximation', title: 'Approximation', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-factors', title: 'Factors, Multiples and Primes', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-fractions', title: 'Fractions', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-percentages', title: 'Percentages and Ratios', theme: 'Number and Numeration', classes: ['jss-2'] },
  { id: 'jss2-directed', title: 'Directed Numbers', theme: 'Basic Operations', classes: ['jss-2'] },
  { id: 'jss2-everyday-arith', title: 'Everyday Arithmetic', theme: 'Basic Operations', classes: ['jss-2'] },
  { id: 'jss2-simple-eq', title: 'Simple Equations in One Variable', theme: 'Algebraic Processes', classes: ['jss-2'] },
  { id: 'jss2-graphs', title: 'Graphs', theme: 'Algebraic Processes', classes: ['jss-2'] },
  { id: 'jss2-inequalities', title: 'Linear Inequalities', theme: 'Algebraic Processes', classes: ['jss-2'] },
  { id: 'jss2-expansion', title: 'Expansion of Algebraic Expressions', theme: 'Algebraic Processes', classes: ['jss-2'] },
  { id: 'jss2-angles-polygons', title: 'Angles and Polygons', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-plane-shapes', title: 'Perimeter and Area of Plane Shapes', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-volume', title: 'Volume of Cubes and Cuboids', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-elevation', title: 'Angles of Elevation and Depression', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-bearing', title: 'Bearing and Distances', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-scale', title: 'Scale Drawing', theme: 'Mensuration and Geometry', classes: ['jss-2'] },
  { id: 'jss2-data', title: 'Data Presentation (Tables & Charts)', theme: 'Everyday Statistics', classes: ['jss-2'] },
  { id: 'jss2-probability', title: 'Probability', theme: 'Everyday Statistics', classes: ['jss-2'] },

  // ─── JSS 3 ───────────────────────────────────────────────────
  { id: 'jss3-binary', title: 'Binary Number System', theme: 'Number and Numeration', classes: ['jss-3'] },
  { id: 'jss3-binary-ops', title: 'Operations in Base 2', theme: 'Number and Numeration', classes: ['jss-3'] },
  { id: 'jss3-proportion', title: 'Direct and Inverse Proportion', theme: 'Number and Numeration', classes: ['jss-3'] },
  { id: 'jss3-compound-interest', title: 'Compound Interest', theme: 'Number and Numeration', classes: ['jss-3'] },
  { id: 'jss3-rational', title: 'Rational and Non-Rational Numbers', theme: 'Number and Numeration', classes: ['jss-3'] },
  { id: 'jss3-factorization', title: 'Factorization of Algebraic Expressions', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-eq-fractions', title: 'Simple Equations Involving Fractions', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-subject', title: 'Change of Subject of Formulae', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-simultaneous', title: 'Simultaneous Linear Equations', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-variation', title: 'Variation', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-word-problems', title: 'Word Problems', theme: 'Algebraic Processes', classes: ['jss-3'] },
  { id: 'jss3-similar', title: 'Similar Shapes and Scale Factor', theme: 'Mensuration and Geometry', classes: ['jss-3'] },
  { id: 'jss3-area', title: 'Area of Plane Figures', theme: 'Mensuration and Geometry', classes: ['jss-3'] },
  { id: 'jss3-trigonometry', title: 'Trigonometry (SOHCAHTOA)', theme: 'Mensuration and Geometry', classes: ['jss-3'] },
  { id: 'jss3-elevation', title: 'Angles of Elevation and Depression', theme: 'Mensuration and Geometry', classes: ['jss-3'] },
  { id: 'jss3-construction', title: 'Construction of Angles and Shapes', theme: 'Mensuration and Geometry', classes: ['jss-3'] },
  { id: 'jss3-central', title: 'Measures of Central Tendency', theme: 'Everyday Statistics', classes: ['jss-3'] },
  { id: 'jss3-pie', title: 'Data Presentation — Pie Charts', theme: 'Everyday Statistics', classes: ['jss-3'] },
  { id: 'jss3-probability', title: 'Probability', theme: 'Everyday Statistics', classes: ['jss-3'] },

  // ─── SS 1 (many themes continue into SS2/SS3) ────────────────
  {
    id: 'ss-number-bases',
    title: 'Number Base System',
    theme: 'Number and Numeration',
    classes: ['ss-1'],
    description: 'Conversion between bases, operations, and computer applications.',
  },
  {
    id: 'ss-modular',
    title: 'Modular Arithmetic',
    theme: 'Number and Numeration',
    classes: ['ss-1'],
  },
  {
    id: 'ss-indices',
    title: 'Indices',
    theme: 'Number and Numeration',
    classes: ['ss-1', 'ss-2'],
    description: 'Laws of indices; revisited with logarithms in SS2.',
  },
  {
    id: 'ss-logarithms',
    title: 'Logarithms',
    theme: 'Number and Numeration',
    classes: ['ss-1', 'ss-2', 'ss-3'],
    description: 'Introduced in SS1; extended in SS2/SS3 with advanced applications.',
  },
  {
    id: 'ss-sets',
    title: 'Sets',
    theme: 'Number and Numeration',
    classes: ['ss-1'],
  },
  {
    id: 'ss-surds',
    title: 'Surds',
    theme: 'Number and Numeration',
    classes: ['ss-2', 'ss-3'],
    description: 'Simplification and rationalization; deepened in SS3.',
  },
  {
    id: 'ss-sequences',
    title: 'Sequences and Series (A.P. & G.P.)',
    theme: 'Number and Numeration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-approximation',
    title: 'Approximation and Accuracy',
    theme: 'Number and Numeration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-commercial',
    title: 'Commercial Arithmetic',
    theme: 'Number and Numeration',
    classes: ['ss-3'],
    description: 'Profit, loss, commission, and related calculations.',
  },
  {
    id: 'ss-simple-eq-variation',
    title: 'Simple Equations and Variations',
    theme: 'Algebraic Processes',
    classes: ['ss-1', 'ss-2'],
  },
  {
    id: 'ss-quadratic',
    title: 'Quadratic Equations',
    theme: 'Algebraic Processes',
    classes: ['ss-1', 'ss-2'],
    description: 'Factorisation in SS1; roots, graphs, and simultaneous forms in SS2.',
  },
  {
    id: 'ss-logical',
    title: 'Logical Reasoning',
    theme: 'Algebraic Processes',
    classes: ['ss-1', 'ss-2'],
  },
  {
    id: 'ss-simultaneous',
    title: 'Simultaneous Linear and Quadratic Equations',
    theme: 'Algebraic Processes',
    classes: ['ss-2'],
  },
  {
    id: 'ss-algebraic-fractions',
    title: 'Algebraic Fractions',
    theme: 'Algebraic Processes',
    classes: ['ss-2'],
  },
  {
    id: 'ss-inequalities',
    title: 'Linear Inequalities',
    theme: 'Algebraic Processes',
    classes: ['ss-2', 'ss-3'],
  },
  {
    id: 'ss-matrices',
    title: 'Matrices and Determinants',
    theme: 'Algebraic Processes',
    classes: ['ss-3'],
  },
  {
    id: 'ss-linear-programming',
    title: 'Linear Programming',
    theme: 'Algebraic Processes',
    classes: ['ss-3'],
  },
  {
    id: 'ss-constructions',
    title: 'Constructions',
    theme: 'Geometry and Mensuration',
    classes: ['ss-1', 'ss-2'],
  },
  {
    id: 'ss-proofs',
    title: 'Proofs of Basic Theorems / Riders',
    theme: 'Geometry and Mensuration',
    classes: ['ss-1'],
  },
  {
    id: 'ss-trig-ratios',
    title: 'Trigonometric Ratios',
    theme: 'Geometry and Mensuration',
    classes: ['ss-1', 'ss-2', 'ss-3'],
    description: 'Right-angled ratios in SS1; sine/cosine rules and graphs across SS2–SS3.',
  },
  {
    id: 'ss-mensuration',
    title: 'Mensuration (Arcs, Sectors, Solids)',
    theme: 'Geometry and Mensuration',
    classes: ['ss-1', 'ss-2', 'ss-3'],
    description: 'Plane figures in SS1; solids and spheres continue through SS3.',
  },
  {
    id: 'ss-circle-geometry',
    title: 'Circle Geometry',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-sine-cosine-rules',
    title: 'Sine and Cosine Rules',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-bearing',
    title: 'Bearing, Elevation and Depression',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-vectors',
    title: 'Vectors in 2D',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-transformation',
    title: 'Transformation Geometry',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2'],
  },
  {
    id: 'ss-coordinate',
    title: 'Coordinate Geometry',
    theme: 'Geometry and Mensuration',
    classes: ['ss-2', 'ss-3'],
  },
  {
    id: 'ss-longitude-latitude',
    title: 'Longitude and Latitude',
    theme: 'Geometry and Mensuration',
    classes: ['ss-3'],
  },
  {
    id: 'ss-spheres',
    title: 'Spheres (Surface Area & Volume)',
    theme: 'Geometry and Mensuration',
    classes: ['ss-3'],
  },
  {
    id: 'ss-differentiation',
    title: 'Differentiation',
    theme: 'Calculus',
    classes: ['ss-3'],
  },
  {
    id: 'ss-integration',
    title: 'Integration',
    theme: 'Calculus',
    classes: ['ss-3'],
  },
  {
    id: 'ss-data-presentation',
    title: 'Data Presentation',
    theme: 'Statistics and Probability',
    classes: ['ss-1', 'ss-2', 'ss-3'],
    description: 'Tables and charts in SS1; grouped data and correlation through SS3.',
  },
  {
    id: 'ss-central-tendency',
    title: 'Mean, Median and Mode',
    theme: 'Statistics and Probability',
    classes: ['ss-1', 'ss-2', 'ss-3'],
  },
  {
    id: 'ss-probability',
    title: 'Probability',
    theme: 'Statistics and Probability',
    classes: ['ss-2', 'ss-3'],
  },
  {
    id: 'ss-correlation',
    title: 'Linear Correlation',
    theme: 'Statistics and Probability',
    classes: ['ss-3'],
  },
];

export const mathematicsSubject: CurriculumSubject = {
  id: 'mathematics',
  name: 'Mathematics',
  description:
    'NERDC General Mathematics for Primary, Junior Secondary, and Senior Secondary — teach from the official curriculum on your AI board.',
  curriculum: 'NERDC (Nigeria)',
  available: true,
  topics,
};

export function getTopicsForClass(
  subject: CurriculumSubject,
  classId: string
): CurriculumTopic[] {
  return subject.topics.filter((topic) => topic.classes.includes(classId as CurriculumTopic['classes'][number]));
}

export function groupTopicsByTheme(
  topicsList: CurriculumTopic[]
): { theme: string; topics: CurriculumTopic[] }[] {
  const order: string[] = [];
  const map = new Map<string, CurriculumTopic[]>();

  for (const topic of topicsList) {
    if (!map.has(topic.theme)) {
      map.set(topic.theme, []);
      order.push(topic.theme);
    }
    map.get(topic.theme)!.push(topic);
  }

  return order.map((theme) => ({ theme, topics: map.get(theme)! }));
}
