# iScript-Split-Index-Documents
Runs as an ImageNow inbound action and splits and/or re-indexes the document using a CSV


Installation instructions
-----------------------------------
1. copy entire ImportSplitIndex directory into the inserver6/scripts directory
2. create symbolic link to the file

    cd /export/$(hostname -s)/inserver6/script
    ln -s /export/$(hostname -s)/inserver6/script/ImportSplitIndex/import-split-index.js import-split-index.js

3. migrate import workflow