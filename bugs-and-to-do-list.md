# Bugs and To-Do List

* Add support for one or more of these?: ChemSpiderID, IUPHAR_ligand, NIAID_ChemDB, and PDB_ligand.
  * ChemSpider ID: https://developer.rsc.org/
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

## API Notes/Stuff

### API Request URLs

* PUG REST
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/estradiol/xrefs/RegistryID/JSON
* ChemIDplus
  * https://chem.nlm.nih.gov/api/data/inchikey/equals/VOXZDWNPVJITMN-ZBRFXRBCSA-N?data=details&format=json

### PubChem PUG

#### PUG REST

* Pug REST API: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/JSON
* Pug REST API synonyms: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/synonyms/JSON
* Pug REST API image: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/PNG
  * More reliable than: https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=5757&t=l
* Remember: `pug_view/data/` vs. `pug_view/index/` give different output

#### PUG View

* Pug View: https://pubchemdocs.ncbi.nlm.nih.gov/pug-view
* Pug: "If only a subcategory of information is desired, a heading can be used to restrict the data returned. Note that the index as above is a convenient way to see what headings are present for a given record, as not all records will have all possible headings present. For example, to get just the experimental property section:"
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/2244/JSON?heading=Experimental+Properties
* Pug: "Or even just a single value type, like melting point:"
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/2244/JSON?heading=Melting+Point
* Examples:
  * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Other-Identifiers
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=CAS
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=UNII
  * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Synonyms
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=MeSH-Entry-Terms
  * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Depositor-Supplied-Synonyms

### Others

* InChIKey to ChemSpiderID (CSID) (no API key required! but only XML output): http://www.chemspider.com/InChI.asmx
  * Example (E2 with encodeURI("InChI=..."):
    * https://www.chemspider.com/InChI.asmx/InChIToCSID?inchi=InChI%3D1S%2FC18H24O2%2Fc1-18-9-8-14-13-5-3-12%2819%2910-11%2813%292-4-15%2814%2916%2818%296-7-17%2818%2920%2Fh3%2C5%2C10%2C14-17%2C19-20H%2C2%2C4%2C6-9H2%2C1H3%2Ft14-%2C15-%2C16%2B%2C17%2B%2C18%2B%2Fm1%2Fs1
  * xml2json (JS): https://stackoverflow.com/questions/1773550/convert-xml-to-json-and-back-using-javascript
* ChemSpiderID? (requires API key): https://developer.rsc.org/
* DrugBank (requires API key): https://docs.drugbank.com/v1/
* GSRS-API is fantastic (CAS (primary vs. non-primary), UNII, ChEMBL, DrugBank, INN, etc.). But only substances in medicines sadly.
  * https://gsrs.ncats.nih.gov/app/substance/dbe30db9-e2f7-42a1-897d-344c3d8f9272
  * https://gsrs.ncats.nih.gov/#/api
* NCI Cactus: https://cactus.nci.nih.gov/chemical/structure (plain-text)
  * Potentially useful data:
    * CAS (gives two for E2, doesn't specify primary)
    * ChemSpiderID (doesn't work)
    * Names
  * Example (retrieves InChIKey for E2):
    * https://cactus.nci.nih.gov/chemical/structure/estradiol/stdinchikey
    * Result: "InChIKey=VOXZDWNPVJITMN-ZBRFXRBCSA-N" (plain text)

## Other Notes

* Drugbox molecular_weight no longer needed as automatically calculated from chemical formula by Drugbox.
* Wiki drugbox: "Physical data. This is entirely optional data, and for most drugs is *not helpful* to the wider readership. Only include if information of particular interest for the drug as to its chemical properties (e.g. in its manufacture or as an important chemical in its own right, e.g. Aspirin)."
  * https://en.wikipedia.org/wiki/Template:Infobox_drug#Physical_data
  * Could get via here in any case if considered in the future:
    * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/5757/JSON?heading=Experimental+Properties

