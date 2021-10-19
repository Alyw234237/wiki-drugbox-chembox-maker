# API Notes

## API Request URLs

* PUG REST
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/estradiol/xrefs/RegistryID/JSON
* ChemIDplus
  * https://chem.nlm.nih.gov/api/data/inchikey/equals/VOXZDWNPVJITMN-ZBRFXRBCSA-N?data=details&format=json
* ChemSpider InChIToCSID
  * https://tunnel.alyw234237.workers.dev/?q=https%3A%2F%2Fwww.chemspider.com%2FInChI.asmx%2FInChIToCSID%3Finchi%3DInChI%253D1S%252FC18H24O2%252Fc1-18-9-8-14-13-5-3-12%252819%252910-11%252813%25292-4-15%252814%252916%252818%25296-7-17%252818%252920%252Fh3%252C5%252C10%252C14-17%252C19-20H%252C2%252C4%252C6-9H2%252C1H3%252Ft14-%252C15-%252C16%252B%252C17%252B%252C18%252B%252Fm1%252Fs1
    * Note: First the InChI needs to be URL-encoded and then the ChemSpider API link needs to be URL-encoded in order to work properly with the tunnel

## PubChem PUG

### PUG REST

* Pug REST API: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/JSON
* Pug REST API synonyms: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/synonyms/JSON
* Pug REST API image: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/PNG
  * More reliable than: https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=5757&t=l
* Remember: `pug_view/data/` vs. `pug_view/index/` give different output

### PUG View

* Pug View: https://pubchemdocs.ncbi.nlm.nih.gov/pug-view
* "If only a subcategory of information is desired, a heading can be used to restrict the data returned. Note that the index as above is a convenient way to see what headings are present for a given record, as not all records will have all possible headings present. For example, to get just the experimental property section:"
  * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/2244/JSON?heading=Experimental+Properties
  * "Or even just a single value type, like melting point:"
    * https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/2244/JSON?heading=Melting+Point
  * Examples:
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Other-Identifiers
      * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=CAS
      * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=UNII
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Synonyms
      * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=MeSH-Entry-Terms
    * https://pubchem.ncbi.nlm.nih.gov/compound/5757#section=Depositor-Supplied-Synonyms

## ChemSpider InChIToCSID

* InChIKey to ChemSpiderID (CSID) (no API key required but only XML output): http://www.chemspider.com/InChI.asmx
* Example (E2 with encodeURI("InChI=..."):
  * https://www.chemspider.com/InChI.asmx/InChIToCSID?inchi=InChI%3D1S%2FC18H24O2%2Fc1-18-9-8-14-13-5-3-12%2819%2910-11%2813%292-4-15%2814%2916%2818%296-7-17%2818%2920%2Fh3%2C5%2C10%2C14-17%2C19-20H%2C2%2C4%2C6-9H2%2C1H3%2Ft14-%2C15-%2C16%2B%2C17%2B%2C18%2B%2Fm1%2Fs1
* xml2json (JS): https://stackoverflow.com/questions/1773550/convert-xml-to-json-and-back-using-javascript

## Others

* DrugBank (requires API key): https://docs.drugbank.com/v1/
* GSRS-API is excellent (CAS (primary vs. non-primary), UNII, ChEMBL, DrugBank, INN, etc.). But only substances in medicines unfortunately.
  * https://gsrs.ncats.nih.gov/app/substance/dbe30db9-e2f7-42a1-897d-344c3d8f9272
  * https://gsrs.ncats.nih.gov/#/api
* NCI Cactus: https://cactus.nci.nih.gov/chemical/structure (plain-text)
  * Potentially useful data:
    * CAS (gives two for E2, doesn't specify primary)
    * Names
  * Example (retrieves InChIKey for E2):
    * https://cactus.nci.nih.gov/chemical/structure/estradiol/stdinchikey
    * Result: "InChIKey=VOXZDWNPVJITMN-ZBRFXRBCSA-N" (plain text)

