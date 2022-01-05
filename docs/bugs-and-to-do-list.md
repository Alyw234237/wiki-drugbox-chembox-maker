# Bugs and To-Do List

* Mobile make button wrapped?
* Add support for one or more of these?: IUPHAR_ligand, NIAID_ChemDB, and PDB_ligand.
  * Guide to Pharmacology / IUPHAR ligand:
    * https://www.guidetopharmacology.org/GRAC/LigandListForward?database=all
    * https://www.guidetopharmacology.org/webServices.jsp (no API key needed)
    * https://www.guidetopharmacology.org/services/ligands?inchikey=LKJPYSCBVHEWIU-UHFFFAOYSA-N
      * Result: `result[0]['ligandId']` -> `2863`
    * But has two entries for E2... ID 1012 and 1013 (good one)
      * https://www.guidetopharmacology.org/services/ligands?inchikey=VOXZDWNPVJITMN-ZBRFXRBCSA-N
  * NIAID ChemDB ID (AIDS#): https://chemdb.niaid.nih.gov/
  * PDB_ligand -> RCSB PDB (Protein Data Bank) ID: https://www.rcsb.org/ and https://www.ebi.ac.uk/pdbe/
* Automatically apply Wiki formatting (e.g., italics) to IUPAC name?
  * PubChem PUG API has an IUPAC string with formatting tags already in it that could potentially be used.
  * But could conflict with escaping. Would need to be done appropriately.
* More sure-fire ChEBI, ChEMBL, KEGG, and/or EINECS filling somehow?
* DrugBank missing sometimes even though on PubChem (we get it from ChemIDplus and if it's not there then no DrugBank ID even if it's on PubChem). Need to grab PubChem one if there. Could get from synonyms list as easier solution.
* Different synonym handling? (Maybe okay, maybe change.)
* Box type radio doesn't change with back/forward. Fix? (Manual history handling?)
* Manual history handling still necessary? Or can remove? (Now that form -> submitted instead of onchange.)

## Other Notes

* Drugbox molecular_weight no longer needed as automatically calculated from chemical formula by Drugbox.
* Wiki drugbox template page says this about physical data (https://en.wikipedia.org/wiki/Template:Infobox_drug#Physical_data):
  * > Physical data. This is entirely optional data, and for most drugs is *not helpful* to the wider readership. Only include if information of particular interest for the drug as to its chemical properties (e.g. in its manufacture or as an important chemical in its own right, e.g. Aspirin).
  * Could get via here in any case if considered in the future:
    * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/5757/JSON?heading=Experimental+Properties

## New (2022/01/04)

- Says ChemIDplus failed if error later in script... (but shouldn't be encountered normally).

