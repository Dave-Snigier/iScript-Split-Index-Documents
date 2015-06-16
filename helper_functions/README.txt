Sometimes the built-in configuration just isn't enough to capture all of the complexity of the campus business processes.

The script allows for you to specify transform functions at any point in the script. These functions in this folder are those functions to be used in those calls.

pointers for writing custom transform functions:
 * should take no arguments
 * returns true on success
 * returns false if there is an issue that necessitates routing the document to the error queue
 * updates only the global staging objects: STAGE_PROPS, STAGE_KEYS, STAGE_NOT_USED
 * should not access the raw report values on the CFG object unless they are not available on one of the staging objects
 * transform functions are run inline so we don't have the eval performance penalty

 The transform functions run in order based on the items in the configuration files for that report with the following precedence:
  1. csvValues
  2. fileNameValues
  3. staticValues

