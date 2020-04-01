const express = require('express');
const router = express.Router();
const indy = require('../../indy/index');
const auth = require('../authentication');

router.get('/', function (req, res, next) {
    res.send("Success");
});

router.get('/message', auth.isLoggedIn, async function (req, res) {
    try{
    let rawMessage = await indy.store.messages.getAll()
    let messages=[]
    for (message of rawMessage){
        messages.push(message)
    }
    res.send(messages)

}catch(e){
    res.send("error")
}
  
});

router.post('/send_connection_request', auth.isLoggedIn, async function (req, res) {
    try{
    let theirEndpointDid = req.body.did;
    let connectionRequest = await indy.connections.prepareRequest(theirEndpointDid);

    let encryptmsg = await indy.crypto.sendAnonCryptedMessage(theirEndpointDid, connectionRequest);
    res.send(encryptmsg+" "+"connection request")
    }catch(e){
        res.send("error")
    }
   
   
});
    

router.post('/issuer/create_schema', auth.isLoggedIn, async function (req, res) {
    let test=await indy.issuer.createSchema(req.body.name_of_schema, req.body.version, req.body.attributes);
    console.log(test)
    res.send(test)

});

router.post('/issuer/create_cred_def', auth.isLoggedIn, async function (req, res) {
    let credid=await indy.issuer.createCredDef(req.body.schema_id, req.body.tag);
    res.send(credid)
   
});

router.post('/issuer/send_credential_offer', auth.isLoggedIn, async function (req, res) {
    await indy.pairwise.pushAttribute(req.body.their_relationship_did,req.body.offers)
    let cred = await indy.credentials.sendOffer(req.body.their_relationship_did, req.body.cred_def_id);
    res.send(cred)
});

router.post('/credentials/accept_offer', auth.isLoggedIn, async function(req, res) {
    let message = indy.store.messages.getMessage(req.body.messageId);
    indy.store.messages.deleteMessage(req.body.messageId);
    let offer=    await indy.credentials.sendRequest(message.message.origin, message.message.message);
    res.send(offer)
});

router.post('/credentials/reject_offer', auth.isLoggedIn, async function(req, res) {
    indy.store.messages.deleteMessage(req.body.messageId);
   
});

router.get("/endpointDid", auth.isLoggedIn, async function (req, res) {
    let resp;
    let did;
    
        did = await indy.did.getEndpointDid();
        
    res.send(did);
});


router.get("/endpointDid", auth.isLoggedIn, async function (req, res) {
    let resp;
    let did;
    
        did = await indy.issuer.getEndpointDid();
        
    res.send(did);
});


router.get("/credentialsDefinition", auth.isLoggedIn, async function (req, res) {
    let resp;
    let did;
    
        didinfo = await indy.issuer.retriveCredDef();
        
    res.send(didinfo);
});

router.post("/credentialsDefinitionByTag", auth.isLoggedIn, async function (req, res) {
    
    
        let tag = req.body.tag
       let  credInfo = await indy.issuer.getCredDefByTag(tag)
        
    res.send(credInfo);
});



router.put('/connections/request', auth.isLoggedIn, async function (req, res) {
   // let name = req.body.name;
    let messageId = req.body.messageId;
    let message = indy.store.messages.getMessage(messageId);
    indy.store.messages.deleteMessage(messageId);
    await indy.connections.acceptRequest( message.message.message.endpointDid, message.message.message.did, message.message.message.nonce);
    
});

router.delete('/connections/request', auth.isLoggedIn, async function (req, res) {
    // FIXME: Are we actually passing in the messageId yet?
    if (req.body.messageId) {
        indy.store.messages.deleteMessage(req.body.messageId);
    }
    
});

router.post('/messages/delete', auth.isLoggedIn, function(req, res) {
    indy.store.messages.deleteMessage(req.body.messageId);
    
});

router.post('/proofs/accept', auth.isLoggedIn, async function(req, res) {
      let crypto =  await indy.proofs.acceptRequest(req.body.messageId);
      res.send(crypto)  
      
});


router.get("/credentials", auth.isLoggedIn, async function (req, res) {
    let endpointCredentials;
    let resp;

        endpointCredentials = await indy.credentials.getAll();
       
    res.send(endpointCredentials);
});


router.post('/requestProof', auth.isLoggedIn, async function(req, res) {
    let myDid = await indy.pairwise.getMyDid(req.body.their_relationship_did);
    console.log(myDid)
    await indy.proofs.sendRequest(myDid, req.body.their_relationship_did,"proofRequestOther", req.body.manual_entry);
    res.send("requested")
  
});


router.get('/relationships', auth.isLoggedIn, async function(req, res) {
 
    let relationships=await indy.pairwise.getAll()
    res.send(relationships)
});

router.post('/proofs/validate', auth.isLoggedIn, async function(req, res) {
    try {
        let proof = req.body;
        if (await indy.proofs.validate(proof)) {
            res.status(200).send();
        } else {
            res.status(400).send();
        }
    } catch(err) {
        res.status(500).send();
    }
});

module.exports = router;