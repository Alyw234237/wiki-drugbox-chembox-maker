// Lodash
var isFinite = _.isFinite;
var indexOf = _.indexOf;
var forOwn = _.forOwn;

var chemical_symbols = [
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S',
  'Cl',
  'Ar',
  'K',
  'Ca',
  'Sc',
  'Ti',
  'V',
  'Cr',
  'Mn',
  'Fe',
  'Co',
  'Ni',
  'Cu',
  'Zn',
  'Ga',
  'Ge',
  'As',
  'Se',
  'Br',
  'Kr',
  'Rb',
  'Sr',
  'Y',
  'Zr',
  'Nb',
  'Mo',
  'Tc',
  'Ru',
  'Rh',
  'Pd',
  'Ag',
  'Cd',
  'In',
  'Sn',
  'Sb',
  'Te',
  'I',
  'Xe',
  'Cs',
  'Ba',
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm',
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
  'Hf',
  'Ta',
  'W',
  'Re',
  'Os',
  'Ir',
  'Pt',
  'Au',
  'Hg',
  'Tl',
  'Pb',
  'Bi',
  'Po',
  'At',
  'Rn',
  'Fr',
  'Ra',
  'Ac',
  'Th',
  'Pa',
  'U',
  'Np',
  'Pu',
  'Am',
  'Cm',
  'Bk',
  'Cf',
  'Es',
  'Fm',
  'Md',
  'No',
  'Lr',
  'Rf',
  'Db',
  'Sg',
  'Bh',
  'Hs',
  'Mt',
  'Ds',
  'Rg',
  'Cn',
  'Nh',
  'Fl',
  'Mc',
  'Lv',
  'Ts',
  'Og'
];

function strictParseInt(value) {
  if (/^(-|\+)?([0-9]+|Infinity)$/.test(value)) {
    return Number(value);
  }
  return NaN;
}

function getAtomicNumber(symbol) {
  var index = indexOf(chemical_symbols, symbol);
  return index > -1
    ? index + 1
    : -1;
}

function chemicalFormula(formula) {
  var ret = {};
  var stack;
  var molecule = '';
  var withinParenthesis = false;

  for (var i = 0, length = formula.length; i < length;) {
    if (formula.charAt(i) === '(') {
      withinParenthesis = true;
      stack = null;
      i++;
      continue;
    }
    else if (formula.charAt(i) === ')') {
      withinParenthesis = false;
      i++;
      continue;
    }

    var lengthOfSymbol;

    // First assume two-character element symbol
    var atomicNumber = getAtomicNumber(formula.substring(i, i + 2));

    // Element's symbol is a single character
    if (atomicNumber === -1) {
      atomicNumber = getAtomicNumber(formula.charAt(i));
      lengthOfSymbol = 1;
    }
    else {
      lengthOfSymbol = 2;
    }

    var mol;

    // Valid symbol
    if (atomicNumber > -1) {
      if (i > 0 && formula.charAt(i - 1) === ')') {
        mol = chemicalFormula(molecule);
        forOwn(mol, function(count, key) {
          if (ret[key]) {
            ret[key] += count;
          }
          else {
            ret[key] = count;
          }
        });
        molecule = '';
      }

      stack = chemical_symbols[atomicNumber - 1];
      if (!withinParenthesis) {
        if (ret[stack]) {
          ret[stack]++;
        }
        else {
          ret[stack] = 1;
        }
      }
      else {
        molecule += stack;
      }
    }
    else {
      var subscript = strictParseInt(formula.substring(i, i + 2));
      if (isFinite(subscript)) {
        if (!stack) {
          throw new Error('Subscript found before element(s)');
        }

        if (!withinParenthesis && molecule !== '') {
          mol = chemicalFormula(molecule);
          forOwn(mol, function(count, key) {
            if (ret[key]) {
              ret[key] += count * subscript;
            }
            else {
              ret[key] = count * subscript;
            }
          });
          molecule = '';
        }
        else {
          ret[stack] += subscript - 1;
          lengthOfSymbol++;
        }
      }
      else {
        subscript = strictParseInt(formula.charAt(i));
        if (isFinite(subscript)) {
          if (!stack) {
            throw new Error('Subscript found before element(s)');
          }

          ret[stack] += subscript - 1;
        }
        else {
          ret[stack]++;
        }
      }
    }

    i += lengthOfSymbol;
  }

  return ret;
}

