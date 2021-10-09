// On window/tab load (not back/forward)
window.onload = function() {

  // Handle URL parameters

  // Get URL parameters
  const query_string = window.location.search;
  const url_params = new URLSearchParams(query_string);

  // Set initial history state information and clear address bar URL parameters
  var state = {
    identifier: '',
    compoundbox: '',
  }
  window.history.replaceState(state, null, window.location.pathname);

  // If applicable URL parameter, then there's a pre-specified identifier -> parse it
  if (url_params.has('i') || url_params.has('id') || url_params.has('cid') || url_params.has('url') || url_params.has('name')) {
    var identifier;
    if (url_params.has('i')) {
      identifier = url_params.get('i');
    } else if (url_params.has('id')) {
      identifier = url_params.get('id');
    } else if (url_params.has('cid')) {
      identifier = url_params.get('cid');
    } else if (url_params.has('url')) {
      identifier = url_params.get('url');
    } else if (url_params.has('name')) {
      identifier = url_params.get('name');
    }
    document.getElementById('identifier').value = identifier;
    parse_input(identifier);
  }

  // Read and set saved box type
  var box_type = localStorage.getItem('box-type');
  if (box_type != 'drugbox') {
    document.getElementById('box-type1').checked = false;
    document.getElementById('box-type2').checked = true;
  }

  return;
};

// On back/forward event
window.onpopstate = function(event) {
  // Restore previous form values if applicable
  if (event.state) {
    if (event.state.identifier || event.state.identifier == '') {
      var identifier = event.state.identifier;
      document.getElementById('identifier').value = identifier;
    }
    if (event.state.compoundbox || event.state.compoundbox == '') {
      var compoundbox = event.state.compoundbox;
      document.getElementById('compoundbox').value = compoundbox;
    }
  }
  return;
};

// Escape all strings in object (including nested)
function escape_all(object) {
  for (var key in object) {
    if (!object.hasOwnProperty(key)) {
      continue;
    }
    if (typeof object[key] !== 'object') {
      object[key] = escape_plaintext_for_wikicode(object[key]);
    } else {
      escape_all(object[key]);
    }
  }
  return object;
}

// Escape plaintext for wikicode in string (via <nowiki></nowiki>)
// Also converts undefined variables to ''
function escape_plaintext_for_wikicode (string) {
  if (string) {
    string = String(string);
    // Escape |, [[, ]], {{, }}, '', <, >
    // Doesn't currently catch `[https://site.com/]` format links
    if (string.match(/([|]|\[{2,}|\]{2,}|[{]{2,}|[}]{2,}|'{2,}|<|>)/)) {
      string = '<nowiki>' + string + '</nowiki>';
    }
  } else {
    string = '';
  }
  return string;
}

var waiting_for_fetch_response = false;

function fetch_cleanup() {
  waiting_for_fetch_response = false;
  loading_animation('hide');
  return;
}

var loading_animation_delay = 2000; // 1 second

// Show or hide loading animation
function loading_animation(display) {
  var loading_animation = document.getElementById('loading-animation');
  if (display == 'hide') {
    loading_animation.style.display = 'none';
  } else if (display == 'show') {
    loading_animation.style.display = 'block';
  }
  return;
}

// Update/change user feedback message
// Possible method options: 'add', 'replace', 'clear'
// Possible color options: 'red', 'orange', 'green', 'blue'
function update_user_message(method, color, message) {
  var user_message = document.getElementById('user_message');
  message = '<span class=' + color + '>' + message + '</span>';
  if (method == 'add') {
    if (user_message.innerHTML == '') {
      user_message.innerHTML = message;
    } else {
      user_message.innerHTML += ' ' + message;
    }
  } else if (method == 'replace') {
    user_message.innerHTML = message;
  } else if (method == 'clear') {
    user_message.innerHTML = '';
  }
  return;
}

// Select compoundbox text after making compoundbox
function select_text(compoundbox) {
  compoundbox.setSelectionRange(0, 0); // Place cursor at start
  compoundbox.focus();
  //compoundbox.select(); // Disable this for now
}

// PubChem ID (CID) or PubChem name
function is_valid_id(identifier) {
  // As of 5 October 2021, lowest PubChem CID is 1 and highest CID is 156612376 (9 digits) (or 156,612,376)
  // 10 digits (9,999,999,999—63x higher than current highest) seems like a reasonable max for foreseeable future
  // Misses input with leading zeros (which are not valid IDs) but not a big deal
  // Also handle 'PCID', 'PCCID', etc. type prefixes if any?
  if (identifier.match(/^[0-9]{1,10}$/)) {
    return true;
  // Names are also acceptable
  } if (identifier.match(/^[a-z0-9\s-_"'+&%()\[\]]{3,}$/i)) {
    return true;
  } else {
    return false;
  }
}

// Called when identifier input field changes
function parse_input(identifier) {

  // Get needed elements
  var compoundbox = document.getElementById('compoundbox');

  // Reset from last time if needed
  compoundbox.value = "";
  update_user_message('clear');

  // Get user input / identifier (if don't already have it)
  if (!identifier) {
    identifier = document.getElementById('identifier').value;
  }

  // Trim any leading/trailing whitespace (spaces, newlines, etc.)
  identifier = identifier.trim();

  // If PubChem URL, isolate the ID or name
  if (identifier.includes('pubchem.ncbi.nlm.nih.gov')) {
    identifier = identifier.replace(/^((https?:[/][/]|https?:|[/][/])?(www[.])?)(pubchem[.]ncbi[.]nlm[.]nih[.]gov[/]compound[/])/, ''); // PubChem protocol/domain/path
    identifier = identifier.replaceAll(/[?].*$/g, ''); // Query string
    identifier = identifier.replaceAll(/#.*$/g, ''); // Fragment
  }

  if (identifier == '') {
    // update_user_message('replace', 'red', 'No identifier entered. Please try again.');
    return;
  }

  // Check that identifier is valid then handle it
  if (is_valid_id(identifier) == true) {
    do_compoundbox(identifier);
  } else {
    update_user_message('replace', 'red', 'Not a valid <a href="https://pubchem.ncbi.nlm.nih.gov/">PubChem</a> compound ID, URL, or name. Please try again.');
    return;
  }

  return;
}

function do_compoundbox(identifier) {

  // Set up variables and get needed elements
  var pubchem_identifier = decodeURIComponent(identifier); // Decode URI if necessary
  var compound_dict = {};
  compound_dict['pubchem_identifier'] = pubchem_identifier;

  fetch_pubchem_rest_json(compound_dict);

  return;
}

// Fetch PubChem compound JSON metadata from PubChem REST API
function fetch_pubchem_rest_json(compound_dict) {
  waiting_for_fetch_response = true;

  // Show loading animation after delay if fetch takes too long
  setTimeout(function() {
    if (waiting_for_fetch_response == true) {
      loading_animation('show');
    }
  }, loading_animation_delay);

  var identifier_string = compound_dict['pubchem_identifier'];
  // If PubChem compound ID (numeric)
  if (compound_dict['pubchem_identifier'].match(/^[0-9]{1,10}$/)) {
    identifier_string = 'cid/' + identifier_string;
  // If PubChem name
  } else {
    identifier_string = 'name/' + encodeURIComponent(identifier_string);
  }

  // https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest
  // Example: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON
  var fetch_url1 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/' + identifier_string + '/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON';
  var fetch_url2 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/' + identifier_string + '/xrefs/RegistryID/JSON';

  Promise.all([
    fetch(fetch_url1),
    fetch(fetch_url2)
  ]).then(([response1, response2]) => {
    if (response1.ok && response2.ok) {
      // Get a JSON object from each of the responses
      return Promise.all([response1, response2].map(response => {
        return response.json();
      }));
    } else {
      return Promise.reject([response1.status, response2.status]);
    }
  }).then(([json1, json2]) => {
    // Combine the two JSON into a single object
    var json = Object.assign({}, json1, json2);
    handle_fetch_pubchem_rest(json, compound_dict);
    return;
  }).catch(error => {
    var error1 = error[0];
    var error2 = error[1];
    fetch_cleanup();
    if ((error1 && error1 === 404) || (error2 && error2 === 404)) {
      update_user_message('replace', 'red', 'Not a valid <a href="https://pubchem.ncbi.nlm.nih.gov/">PubChem</a> compound ID, URL, or name. Please try again.');
    } else if ((error1 && error1 === 429) || (error2 && error2 === 429)) {
      update_user_message('replace', 'red', '<a href="https://pubchem.ncbi.nlm.nih.gov/">PubChem</a> says too many requests right now. Please try again later.');
    } else {
      // error=='TypeError: Failed to fetch' (when no Internet connection) will go here (as well as other errors)
      update_user_message('replace', 'red', 'The web request to <a href="https://pubchem.ncbi.nlm.nih.gov/">PubChem</a> failed. You might not have Internet connectivity right now or PubChem might be having issues or there might be another problem. Please try again. If it still doesn\'t work, try again later.');
    }
    return;
  });

  return;
}

function handle_fetch_pubchem_rest(json, compound_dict) {

  var compound_metadata = json;
  //console.log(compound_metadata);

  // Combine everything into one well-structured object
  var properties = compound_metadata['PropertyTable']['Properties'][0];
  var synonyms = compound_metadata['InformationList']['Information'][0]['RegistryID'];
  properties['synonyms'] = synonyms;
  compound_dict = Object.assign({}, compound_dict, properties);

  // If standard/simple chemical formula
  // Another/different handling library to look at (no Lodash): https://github.com/kanedaron/chemical-regex
  if (compound_dict['MolecularFormula']) {
    // Chemical formula regex: /^([A-Z][a-z]?[0-9]{0,6})+$/ (no longer used here for now)
    // Largest known protein is titin (connectin), with formula of C(169,719)H(270,466)N(45,688)O(52,238)S(911)
    // So 6 digits seems good for maximum number in chemical formula
    var molecular_formula = compound_dict['MolecularFormula'];
    // Extract charge if applicable
    if (molecular_formula.match(/[+-][0-9]*$/)) {
      var charge = molecular_formula.match(/[+-][0-9]*$/)[0]; // Get charge
      charge = charge.replace(/^([+-])([0-9]+)$/, "$2$1"); // Swap charge +/- and # (e.g., -2 to 2-)
      molecular_formula = molecular_formula.replace(/[+-][0-9]*$/, ''); // Remove charge from molecular formula
      compound_dict['Charge'] = charge;
    }
    molecular_formula = chemicalFormula(molecular_formula); // Won't handle charge, will mess it up
    compound_dict['MolecularFormula'] = molecular_formula;
  }

  // Remove 'InChI=' from start of StdInChI string
  compound_dict['InChI'] = compound_dict['InChI'].replace(/^(InChI=)/, '');

  // Get ChEBI from synonyms
  var ChEBI = compound_dict['synonyms'].find(value => /^C[Hh]EBI:[0-9]+$/.test(value));
  if (ChEBI) {
    // Remove 'ChEBI:' from start of string
    ChEBI = ChEBI.replace(/^C[Hh]EBI:/, '');
    ChEBI = ChEBI.match(/^[0-9]+$/)[0];
    // Prior way using positive lookbehind
    //ChEBI = ChEBI.match(/(?<=^C[Hh]EBI:)[0-9]+$/)[0];
    compound_dict['ChEBI'] = ChEBI;
  }

  // Get ChEMBL from synonyms
  // ChEMBL is prefixed with 'ChEMBL' then appears to start at 1
  // http://chembl.blogspot.com/2011/08/chembl-identifiers.html
  var ChEMBL = compound_dict['synonyms'].find(value => /^C[Hh]EMBL[0-9]+$/.test(value));
  if (ChEMBL) {
    // Remove 'ChEMBL' from start of string
    ChEMBL = ChEMBL.replace(/^C[Hh]EMBL/, '');
    ChEMBL = ChEMBL.match(/^[0-9]+$/)[0];
    // Prior way using positive lookbehind
    //ChEMBL = ChEMBL.match(/(?<=^C[Hh]EBI:)[0-9]+$/)[0];
    compound_dict['ChEMBL'] = ChEMBL;
  }

  // Get KEGG compound ID and/or drug ID from synonyms
  // KEGG takes the form of 'C' for compound or 'D' for drug then five digits
  // https://www.genome.jp/kegg/kegg3.html
  var KEGG_drug = compound_dict['synonyms'].find(value => /^D[0-9]{5}$/.test(value));
  if (KEGG_drug) {
    compound_dict['KEGGdrug'] = KEGG_drug;
  }
  var KEGG_compound = compound_dict['synonyms'].find(value => /^C[0-9]{5}$/.test(value));
  if (KEGG_compound) {
    compound_dict['KEGGcompound'] = KEGG_compound;
  }

  fetch_chemidplus_json(compound_dict);

  return;
}

// Fetch ChemIDplus JSON metadata from ChemIDplus API
function fetch_chemidplus_json(compound_dict) {
  var fetch_url = 'https://chem.nlm.nih.gov/api/data/inchikey/equals/' + encodeURIComponent(compound_dict['InChIKey']) + 
                  '?data=details&format=json';

  fetch(fetch_url)
  .then(response => {
    fetch_cleanup();
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response.status);
  })
  .then(json => {
    handle_fetch_chemidplus(json, compound_dict);
    return;
  })
  .catch(error => {
    fetch_cleanup();
    if (error === 404) {
      update_user_message('add', 'orange', 'No <a href="https://chem.nlm.nih.gov/chemidplus/">ChemIDplus</a> entry for this compound so couldn\'t pull data from ChemIDplus. Please fill in the missing fields manually.');
    } else if (error === 429) {
      update_user_message('add', 'orange', '<a href="https://chem.nlm.nih.gov/chemidplus/">ChemIDplus</a> says too many requests right now so couldn\'t pull data from ChemIDplus. Please try again later for full parameters.');
    } else {
      update_user_message('add', 'orange', 'The web request to <a href="https://chem.nlm.nih.gov/chemidplus/">ChemIDplus</a> failed. Hence, couldn\'t pull data from it. This happens sometimes. Please try again for full parameters. If it still doesn\'t work, try again later.');
    }
    // Continue without doing handle_fetch_chemidplus()
    construct_compoundbox(compound_dict);
    return;
  });

  return;
}

function handle_fetch_chemidplus(json, compound_dict) {

  var chemidplus_metadata = json;
  //console.log(chemidplus_metadata);

  compound_dict['ChemIDplus'] = {};

  // Ensure exactly 1 result (no more or less than this)
  if (chemidplus_metadata && chemidplus_metadata['total'] && chemidplus_metadata['total'] > 0) {

    // Check if more than one (happens with e.g. estradiol InChIKey search...)
    if (chemidplus_metadata['total'] > 1) {
      console.log('Warning: two results retrieved for ChemIDplus InChIKey search... taking first result only.');
    }

    // Filter to first result
    chemidplus_metadata = chemidplus_metadata['results'][0];
    //console.log(chemidplus_metadata);

    // Get ChemIDplus 'summary' items we care about
    var summary = chemidplus_metadata['summary'];
    compound_dict['ChemIDplus']['name_special'] = summary['na']; // Format: 'Name [USAN:USP:INN:BAN]'
    compound_dict['ChemIDplus']['CASNo'] = summary['rn'];
    compound_dict['ChemIDplus']['MolWeight'] = summary['w']; // Four decimal places

    // Get all ChemIDplus 'resources' items and put into easier to work with form
    var resources_temp = {};
    var resources = chemidplus_metadata['resources'];
    for (var i = 0; i < resources.length; i++) {
      var e = resources[i]['e'];
      for (var j = 0; j < e.length; j++) {
        // If doesn't already exist
        if (!resources_temp[e[j]['d']]) {
          resources_temp[e[j]['d']] = e[j]['u'];
        } else {
          console.log('Warning: key already exists... unexpected duplicate encountered.');
        }
      }
    }
    resources = resources_temp;
    //console.log(resources);

    // Take the 'resources' items we care about
    compound_dict['ChemIDplus']['DailyMedID'] = resources['DailyMed'];
    compound_dict['ChemIDplus']['MedlinePlus'] = resources['MedlinePlusDrug']; // Has '.html' at end of string
    //compound_dict['ChemIDplus']['ChEBI'] = resources['ChEBI']; // If exists (check.. undefined for bica, E2)
    //compound_dict['ChemIDplus']['ChEMBL'] = resources['ChEMBL']; // If exists (check.. didn't for bica, E2)
    compound_dict['ChemIDplus']['DrugBank'] = resources['DrugBank'];
    compound_dict['ChemIDplus']['UNII'] = resources['FDA SRS']; // Has 'unii/' at start of string
    compound_dict['ChemIDplus']['Wikipedia'] = resources['Wikipedia']; // Do something with this?

    // Fix a couple of items
    if (compound_dict['ChemIDplus']['MedlinePlus']) {
      compound_dict['ChemIDplus']['MedlinePlus'] = compound_dict['ChemIDplus']['MedlinePlus'].replace(/[.]html$/, '');
    }
    if (compound_dict['ChemIDplus']['UNII']) {
      compound_dict['ChemIDplus']['UNII'] = compound_dict['ChemIDplus']['UNII'].replace(/^unii[/]/, '');
    }

    // Get all ChemIDplus 'names' (or 'synonyms') items and put into easier to work with form
    var names_temp = [];
    var names = chemidplus_metadata['names'];
    for (var i = 0; i < names.length; i++) {
      var e = names[i]['e'];
      for (var j = 0; j < e.length; j++) {
        names_temp.push(e[j]['d']);
      }
    }
    names = names_temp;
    //console.log(names);

    // Take all of the synonyms
    compound_dict['ChemIDplus']['synonyms'] = [];
    compound_dict['ChemIDplus']['synonyms'] = names;

    // Get EINECS from synonyms
    // EINECS format: seven-digit number of the form 2XX-XXX-X or 3XX-XXX-X
    // https://www.chemeurope.com/en/encyclopedia/EINECS_number.html
    // https://en.wikipedia.org/wiki/European_Community_number
    var EINECS = compound_dict['ChemIDplus']['synonyms'].find(value => /^EINECS [23][0-9]{2}-[0-9]{3}-[0-9]$/.test(value));
    if (EINECS) {
      // Remove 'EINECS' from start of string
      EINECS = EINECS.replace(/^EINECS /, '');
      EINECS = EINECS.match(/^[23]{1}[0-9]{2}-[0-9]{3}-[0-9]{1}$/)[0];
      // Prior way using positive lookbehind
      //EINECS = EINECS.match(/(?<=^EINECS )[23][0-9]{2}-[0-9]{3}-[0-9]$/)[0];
      compound_dict['ChemIDplus']['EINECS'] = EINECS;
    } else {
      compound_dict['ChemIDplus']['EINECS'] = undefined;
    }

    //console.log(compound_dict['ChemIDplus']);
  }

  //console.log(compound_dict);

  construct_compoundbox(compound_dict);

  return;
}

// Construct Wikipedia drugbox/chembox
function construct_compoundbox(compound_dict) {

  // Define not-yet-handled variables for now
  compound_dict['ChemSpiderID'] = undefined;

  // Escape special characters with <nowiki> tags
  // Also convert undefined variables to ''
  compound_dict = escape_all(compound_dict);

  // Get box type user input
  var box_type = document.getElementById('box-type1').checked;

  // Drugbox
  if (box_type == true) {
    make_drugbox(compound_dict);
    // Save box_type for next time
    localStorage.setItem('box-type', 'drugbox');
  // Chembox
  } else {
    make_chembox(compound_dict);
    // Save box_type for next time
    localStorage.setItem('box-type', 'chembox');
  }

  return;
}

// Make Wikipedia drugbox
// https://en.wikipedia.org/wiki/Template:Infobox_drug (same as Template:Drugbox (redirect))
function make_drugbox(compound_dict) {

  var compoundbox_string = `{{Infobox drug
| drug_name = 
| INN = 
| type = <!-- empty -->
| image = 
| width = 
| alt = 
| caption = 

<!-- Clinical data -->
| pronounce = 
| tradename = 
| Drugs.com = \n`;

// MedlinePlus
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['MedlinePlus']) {
    compoundbox_string += `| MedlinePlus = ` + compound_dict['ChemIDplus']['MedlinePlus'] + `\n`;
  } else {
    compoundbox_string += `| MedlinePlus = \n`;
  }

  compoundbox_string += `| licence_CA = <!-- Health Canada may use generic or brand name (generic name preferred) -->\n`;
  compoundbox_string += `| licence_EU = <!-- EMA uses INN (or special INN_EMA) -->\n`;

  // DailyMedID
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['DailyMedID']) {
    compoundbox_string += `| DailyMedID = ` + compound_dict['ChemIDplus']['DailyMedID'] + `\n`;
  } else {
    compoundbox_string += `| DailyMedID = <!-- DailyMed may use generic or brand name (generic name preferred) -->\n`;
  }

  compoundbox_string += `| licence_US = <!-- FDA may use generic or brand name (generic name preferred) -->
| pregnancy_AU = <!-- A / B1 / B2 / B3 / C / D / X -->
| pregnancy_AU_comment = 
| pregnancy_category = 
| dependency_liability = 
| addiction_liability = 
| routes_of_administration = 
| class = 
| ATCvet = 
| ATC_prefix = <!-- 'none' if uncategorised -->
| ATC_suffix = 
| ATC_supplemental = 

<!-- Legal status -->
| legal_AU = <!-- S2, S3, S4, S5, S6, S7, S8, S9 or Unscheduled -->
| legal_AU_comment = 
| legal_BR = <!-- OTC, A1, A2, A3, B1, B2, C1, C2, C3, C4, C5, D1, D2, E, F -->
| legal_BR_comment = 
| legal_CA = <!-- OTC, Rx-only, Schedule I, II, III, IV, V, VI, VII, VIII -->
| legal_CA_comment = 
| legal_DE = <!-- Anlage I, II, III or Unscheduled -->
| legal_DE_comment = 
| legal_NZ = <!-- Class A, B, C -->
| legal_NZ_comment = 
| legal_UK = <!-- GSL, P, POM, CD, CD Lic, CD POM, CD No Reg POM, CD (Benz) POM, CD (Anab) POM or CD Inv POM / Class A, B, C -->
| legal_UK_comment = 
| legal_US = <!-- OTC / Rx-only / Schedule I, II, III, IV, V -->
| legal_US_comment = 
| legal_EU = 
| legal_EU_comment = 
| legal_UN = <!-- N I, II, III, IV / P I, II, III, IV -->
| legal_UN_comment = 
| legal_status = <!-- For countries not listed above -->

<!-- Pharmacokinetic data -->
| bioavailability = 
| protein_bound = 
| metabolism = 
| metabolites = 
| onset = 
| elimination_half-life = 
| duration_of_action = 
| excretion = 

<!-- Identifiers -->\n`;

  // CAS number
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['CASNo']) {
    compoundbox_string += `| CAS_number = ` + compound_dict['ChemIDplus']['CASNo'] + `\n`;
  } else {
    compoundbox_string += `| CAS_number = \n`;
  }
  compoundbox_string += `| CAS_supplemental = \n`;

  // PubChem
  compoundbox_string += `| PubChem = ` + compound_dict['CID'] + `\n`;

  compoundbox_string += `| PubChemSubstance = \n`;

  // Guide to Pharmacology / IUPHAR ligand
  // https://www.guidetopharmacology.org/GRAC/LigandListForward?database=all
  // To-do: fill this in automatically?
  // https://www.guidetopharmacology.org/webServices.jsp
  // ^ No API key needed
  // https://www.guidetopharmacology.org/services/ligands?inchikey=LKJPYSCBVHEWIU-UHFFFAOYSA-N
  // ^ Result: result[0]['ligandId'] // 2863
  // But has two entries for E2... ID 1012 and 1013 (good one)
  // https://www.guidetopharmacology.org/services/ligands?inchikey=VOXZDWNPVJITMN-ZBRFXRBCSA-N
  compoundbox_string += `| IUPHAR_ligand = \n`;

  // DrugBank
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['DrugBank']) {
    compoundbox_string += `| DrugBank = ` + compound_dict['ChemIDplus']['DrugBank'] + `\n`;
  } else {
    compoundbox_string += `| DrugBank = \n`;
  }

  // ChemSpider ID (https://developer.rsc.org/)
  // To-do: fill this in automatically?
  compoundbox_string += `| ChemSpiderID = \n`;

  // UNII
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['UNII']) {
    compoundbox_string += `| UNII = ` + compound_dict['ChemIDplus']['UNII'] + `\n`;
  } else {
    compoundbox_string += `| UNII = \n`;
  }

  // KEGG
  // To-do: more sure-fire KEGG filling?
  if (compound_dict['KEGGdrug']) {
    compoundbox_string += `| KEGG = ` + compound_dict['KEGGdrug'] + `\n`;
  } else if (compound_dict['KEGGcompound']) {
    compoundbox_string += `| KEGG = ` + compound_dict['KEGGcompound'] + `\n`;
  } else {
    compoundbox_string += `| KEGG = \n`;
  }

  // ChEBI
  // To-do: more sure-fire ChEBI filling?
  if (compound_dict['ChEBI']) {
    compoundbox_string += `| ChEBI = ` + compound_dict['ChEBI'] + `\n`;
  } else {
    compoundbox_string += `| ChEBI = \n`;
  }

  // ChEMBL
  // To-do: more sure-fire ChEMBL filling?
  if (compound_dict['ChEMBL']) {
    compoundbox_string += `| ChEMBL = ` + compound_dict['ChEMBL'] + `\n`;
  } else {
    compoundbox_string += `| ChEMBL = \n`;
  }

  // Warning about not-100%-certainty with KEGG, ChEBI, and ChEMBL identifiers for now
  if (compound_dict['KEGGdrug'] || compound_dict['KEGGcompound'] || compound_dict['ChEBI'] || compound_dict['ChEMBL']) {
    update_user_message('add', 'green', 'Autofilled ChEBI, ChEMBL, and/or KEGG with form-matching identifiers from the PubChem synonyms list. Please double check them for accuracy.');
  }

  // NIAID ChemDB ID (AIDS#) (https://chemdb.niaid.nih.gov/)
  // To-do: fill this in automatically?
  compoundbox_string += `| NIAID_ChemDB = \n`;

  // RCSB PDB (Protein Data Bank) ID (https://www.rcsb.org/ | https://www.ebi.ac.uk/pdbe/)
  // To-do: fill this in automatically?
  compoundbox_string += `| PDB_ligand = \n`;

  // Synonyms
  // To-do: Change this... maybe put synonyms in another box and tell user to go through them
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['synonyms'] && 
      compound_dict['ChemIDplus']['synonyms'].length > 0) {
    var synonyms_string = '';
    for (var i = 0; i < compound_dict['ChemIDplus']['synonyms'].length; i++) {
      synonyms_string += compound_dict['ChemIDplus']['synonyms'][i];
      if (i != compound_dict['ChemIDplus']['synonyms'].length - 1) {
        synonyms_string += '; ';
      }
    }
    compoundbox_string += `| synonyms = ` + synonyms_string + `\n`;
    update_user_message('add', 'green', 'Synonyms field included. Please check and fix it.');
  } else {
    compoundbox_string += `| synonyms = \n`;
  }

  compoundbox_string += `\n`;

  compoundbox_string += `<!-- Chemical data -->\n`;

  // IUPAC name
  if (compound_dict['IUPACName']) {
    compoundbox_string += `| IUPAC_name = ` + compound_dict['IUPACName'] + `\n`;
  } else {
    compoundbox_string += `| IUPAC_name = \n`;
  }

  // Chemical formula
  if (compound_dict['MolecularFormula']) {
    var index = 0;
    for (const [key, value] of Object.entries(compound_dict['MolecularFormula'])) {
      if (chemical_symbols.includes(key)) {
        if (index == 0) {
          compoundbox_string += `| ` + key + `=` + value;
        } else {
          compoundbox_string += ` | ` + key + `=` + value;
        }
      }
      index++;
    }
    if (compound_dict['Charge']) {
      compoundbox_string += ` | charge = ` + compound_dict['Charge'];
    }
    compoundbox_string += `\n`;
  }

  // No longer needed, automatically calculated by template drugbox (except unusual cases?)
  /*if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['MolWeight']) {
    compoundbox_string += `| molecular_weight = ` + compound_dict['ChemIDplus']['MolWeight'] + `\n`;
  } else if (compound_dict['MolecularWeight']) {
    compoundbox_string += `| molecular_weight = ` + compound_dict['MolecularWeight'] + `\n`;
  } else {
    compoundbox_string += `| molecular_weight = \n`;
  }*/

  // SMILES
  if (compound_dict['IsomericSMILES']) {
    compoundbox_string += `| SMILES = ` + compound_dict['IsomericSMILES'] + `\n`;
  } else if (compound_dict['CanonicalSMILES']) {
    compoundbox_string += `| SMILES = ` + compound_dict['CanonicalSMILES'] + `\n`;
  } else {
    compoundbox_string += `| SMILES = \n`;
  }

  // Automatically handled by template drugbox (only used to control handling (e.g., turn off))
  compoundbox_string += `| Jmol = \n`;

  // StdInChI
  if (compound_dict['InChI']) {
    compoundbox_string += `| StdInChI = ` + compound_dict['InChI'] + `\n`;
  } else {
    compoundbox_string += `| StdInChI = \n`;
  }
  compoundbox_string += `| StdInChI_comment = \n`;

  // StdInChIKey
  if (compound_dict['InChIKey']) {
    compoundbox_string += `| StdInChIKey = ` + compound_dict['InChIKey'] + `\n`;
  } else {
    compoundbox_string += `| StdInChIKey = \n`;
  }

  compoundbox_string += `\n`;

  // Wiki drugbox: "Physical data. This is entirely optional data, and for most drugs is *not helpful* to the wider readership. Only include if information of particular interest for the drug as to its chemical properties (e.g. in its manufacture or as an important chemical in its own right, e.g. Aspirin)."
  // https://en.wikipedia.org/wiki/Template:Infobox_drug#Physical_data
  // Could get via here in any case if considered in the future:
  // https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/5757/JSON?heading=Experimental+Properties

  compoundbox_string += `<!-- Physical data -->
| density = 
| density_notes = 
| melting_point = 
| melting_high = 
| melting_notes = 
| boiling_point = 
| boiling_notes = 
| solubility = 
| sol_units = 
| specific_rotation = 
}}`;

  // Add some more stuff?
  var add_more_stuff = false;
  if (add_more_stuff == true) {
    compoundbox_string = add_more_stuff(compoundbox_string);
  }

  // Do after construct compoundbox stuff

  update_compoundbox(compoundbox_string);

  return compoundbox_string;
}

// Make Wikipedia chembox
// https://en.wikipedia.org/wiki/Template:Chembox
function make_chembox(compound_dict) {

  // The ChemIDplus are going to error if ChemIDplus not fetched
  var compoundbox_string = `{{Chembox
<!-- Images -->
| ImageFile = 
| ImageSize = 
| ImageAlt = 
<!-- Names -->
| IUPACName = ` + (compound_dict['IUPACName'] || '') + `
| OtherNames = ` + (compound_dict['ChemIDplus']['synonyms'] || '') + `
<!-- Sections -->
| Section1 = {{Chembox Identifiers
| CASNo = ` + (compound_dict['ChemIDplus']['CASNo'] || '') + `
| ChEBI = ` + (compound_dict['ChEBI'] || '') + `
| ChEMBL = ` + (compound_dict['ChEMBL'] || '') + `
| ChemSpiderID = ` + (compound_dict['ChemSpiderID'] || '') + `
| DrugBank = ` + (compound_dict['ChemIDplus']['DrugBank'] || '') + `
| EINECS = ` + (compound_dict['ChemIDplus']['EINECS'] || '') + `
| EC_number = 
| EC_number_Comment = 
| InChI = ` + (compound_dict['InChI'] || '') + `
| InChIKey = ` + (compound_dict['InChIKey'] || '') + `
| KEGG = ` + (compound_dict['KEGGcompound'] || compound_dict['KEGGdrug'] || '') /* Fix? */ + `
| MeSHName = 
| PubChem = ` + (compound_dict['CID'] || '') + `
| SMILES = ` + (compound_dict['IsomericSMILES'] || compound_dict['CanonicalSMILES'] || '') /* Fix? */ + `
  }}
| Section2 = {{Chembox Properties
| Formula = ` + (compound_dict['MolecularFormula'] || '') /* Fix */ + `
| MolarMass = ` + (compound_dict['ChemIDplus']['MolWeight'] || '') /* Fix?; also fix g/mol -> */ + ` g/mol
| Appearance = 
| Density = 
| MeltingPt = 
| BoilingPt = 
| Solubility = 
  }}
| Section3 = {{Chembox Hazards
| MainHazards = 
| FlashPt = 
| AutoignitionPt = 
  }}
}}`;

  // Warning about not-100%-certainty with KEGG, ChEBI, ChEMBL, and EINECS identifiers for now
  if (compound_dict['KEGGdrug'] || compound_dict['KEGGcompound'] || compound_dict['ChEBI'] || compound_dict['ChEMBL'] || compound_dict['ChemIDplus']['EINECS']) {
    update_user_message('add', 'green', 'Autofilled ChEBI, ChEMBL, KEGG, and/or EINECS with form-matching identifiers from synonyms lists. Please double check them for accuracy.');
  }

  // ...

  // Add some more stuff?
  var add_more_stuff = false;
  if (add_more_stuff == true) {
    compoundbox_string = add_more_stuff(compoundbox_string);
  }

  // Do after construct compoundbox stuff

  update_compoundbox(compoundbox_string);

  return compoundbox_string;
}

// Do some extra stuff? (I.e., start article)
function add_more_stuff(compoundbox_string) {

  compoundbox_string += `\n\n`;
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['name_special']) {
    compoundbox_string += `'''` + compound_dict['ChemIDplus']['name_special'] + `''' is a ...`;
  } else if (compound_dict['Title']) {
    compoundbox_string += `'''` + compound_dict['Title'] + `''' is a ...`;
  }
  compoundbox_string += `\n\n`;
  compoundbox_string += `==References==\n{{Reflist}}\n\n`;

  return compoundbox_string;
}

// Update compoundbox textarea after generating compoundbox
function update_compoundbox(compoundbox_string) {

  var compoundbox = document.getElementById('compoundbox');
  compoundbox.value = compoundbox_string;

  // Focus/select compoundbox text
  select_text(compoundbox);

  // Update page history
  var identifier = document.getElementById('identifier').value;
  var state = {
    identifier: identifier,
    compoundbox: compoundbox_string,
  }
  window.history.pushState(state, null);

  return;
}

