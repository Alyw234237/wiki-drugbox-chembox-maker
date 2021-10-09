# Wikipedia Drugbox and Chembox Maker

A [Wikipedia](https://www.wikipedia.org/) template generator and autofiller for [Drugboxes](https://en.wikipedia.org/wiki/Template:Infobox_drug) and [Chemboxes](https://en.wikipedia.org/wiki/Template:Chembox). Use the tool here:

* <https://alyw234237.github.io/wiki-drugbox-chembox-maker/>

Can accept as input [PubChem compound IDs](https://en.wikipedia.org/wiki/PubChem#Databases) (CIDs), PubChem compound URLs, PubChem-indexed compound names, and PubChem-indexed compound synonyms and other identifiers (e.g., CAS number).

Purely client-side tool (JavaScript) with no server-side component and hence no risk of server-associated downtime. Uses the [NCBI PubChem PUG (Power User Gateway) REST API](https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest) followed by the [NLM ChemID*plus* API](https://chem.nlm.nih.gov/api/swagger-ui.html) for retrieving compound data used to fill Drugboxes and Chemboxes.

Currently certain identifier fields like ChemSpiderID, IUPHAR_ligand, NIAID_ChemDB, and PDB_ligand are not autofilled but could be in the future.

<!-- Uses [positive lookbehind](https://javascript.info/regexp-lookahead-lookbehind) in JavaScript regular expressions, which is not yet supported in all web browsers. As a result, may not work correctly at this time with [Safari, browsers on iOS, and older browsers](https://caniuse.com/js-regexp-lookbehind). -->
<!-- ^ Fixed/Replaced current two instances -->

See also [Help:Citation tools - English Wikipedia](https://en.wikipedia.org/wiki/Help:Citation_tools) for more tools like this one. The [Diberri Template builder](https://citation-template-filling.toolforge.org/cgi-bin/index.cgi) is a similar but unrelated tool that can be used to generate Chemboxes with PubChem compound IDs and Drugboxes with [DrugBank](https://drugbank.com/) IDs. However, this tool only fills a few fields; PubChem compound IDs cannot be used to generate Drugboxes; compounds with DrugBank IDs are limited mostly to marketed drugs—a small selection of possible compounds; and Drugbox generation using DrugBank IDs seems to be broken currently (and [has been for a while](https://web.archive.org/web/20200712040837/https://citation-template-filling.toolforge.org/cgi-bin/index.cgi?type=drugbank_id&id=DB00328)).

<!-- To add to left sidebar on Wikipedia for quicker access, see User:XXXXX/scripts/XXXXX. -->

