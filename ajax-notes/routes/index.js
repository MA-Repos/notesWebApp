var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var mc = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var notesCollection;

var connectToDBs = function(callback) {
    mc.connect('mongodb://localhost/persistent-notes', function(err, db) {
        if (err) {
            throw err;
        }
        
        notesCollection = db.collection('notes');

        if (callback) {
            callback();
        }
    });
}

// connect to DB when file is loaded
connectToDBs();

router.get('/', function(req, res) {
    if (req.session.username) {
        res.redirect("/notes");
    } else {
        res.render('index', { title: 'COMP 2406 AJAX Notes Demo', 
                              error: req.query.error });
    }
});

router.get('/notes', function(req, res) {
    var username = req.session.username;

    if (username) {
        res.render("notes.jade", {username: username,
                                  title: username +"'s Notes"});
    } else {
        res.redirect("/?error=Not Logged In");
    }
});

router.post('/login', function(req, res) {
    var username = req.body.username;
    req.session.username = username;

    res.redirect("/notes")
});

router.post('/logout', function(req, res) {
    req.session.destroy(function(err){
        if (err) {
            console.log("Error: %s", err);
        }
    });
    res.redirect("/");
});

router.get('/getNotes', function(req, res) {
    var username = req.session.username;

    var renderNotes = function(err, notes) {
        if (err) {
            notes = [{"title": "Couldn't get notes",
                      "owner": username,
                      "content": "Error fetching notes!"}];
        }
        res.send(notes);
    }
    
    if (username) {
        notesCollection.find({owner: username}).toArray(renderNotes);
    } else {
        res.send([{"title": "Not Logged In",
                   "owner": "None",
                   "content": "Nobody seems to be logged in!"}]);
    }    
});

router.post('/delete', function(req, res) {
    var username = req.session.username;
    var note;
    var noteTitle;
    var done;
    var noteId=ObjectID(req.body.id);

    var checkSuccessful = function(err,done) {
        if (!done || err) {
            res.send("ERROR: update failed");
        } else {        
            res.send("update succeeded");            
            
        }
    }
    var checkUpdate = function(err,note) {
        if (err) {
            done =false;
            res.send("ERROR: update failed");
        } else {        
            noteTitle=note.title;
            done=true;
            notesCollection.remove({_id: noteId},checkSuccessful);
            
        }
    }
     
    if (username) {
        notesCollection.findOne({_id: noteId},checkUpdate)
    } else {
        res.send("Not Logged In");
    }
});

router.post('/changeusername', function(req, res) {
    var username = req.session.username;
    var noteId=ObjectID(req.body.id);
    var newUsername= req.body.newUsr;

	var changeUserReport = function(err, note) {

		if(note !=0){
            //send error msg and username
		    res.send({msg:"ERROR: username not changed",UsrExits:newUsername});
		    //return;
		}else{
			//change owner of that all notes user has and then callback checkupdate
			notesCollection.update({ owner:username},{$set: {owner: newUsername}},{multi: true },checkUpdate)
			
		}
	}

    var checkUpdate = function(err, result) {
		if (err) {
            res.send({msg:"ERROR: username not changed",UsrExits:newUsername});
                      
		} else {
			//if database(mongo) is updated successfully, change username in session
			req.session.username=newUsername;
            res.send({msg:"update succeeded",UsrExits:newUsername});   
		}
    }
    
    if (username) {
    	//first check if user already exits
    	//if find returns 0, it means we can create new user
  		notesCollection.find({owner: newUsername }).toArray(changeUserReport);
    } else {
            res.send("ERROR: not logged in");
    }
});

router.post('/updateNote', function(req, res) {
    var username = req.session.username;
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;
    
    var checkUpdate = function(err, result) {
        if (err) {
            res.send("ERROR: update failed");
        } else {
            res.send("update succeeded");
        }
    }
    
    if (username) {
        if (id && title && content) {
            // should get note and check 
            // if it really belongs to the current user
            notesCollection.update({_id: ObjectID(id)},
                                   {$set: {title: title,
                                           content: content}},
                                   checkUpdate);
        } else {
            res.send("ERROR: bad parameters");
        }
    } else {
        res.send("ERROR: not logged in");
    }
});



router.post('/newNote', function(req, res) {
    var username = req.session.username;
    var newNote;

    var reportInserted = function(err, notesInserted) {
        if (err) {
            res.send("ERROR: Could not create a new note");
        } else {
            res.send(notesInserted[0]._id);
        }
    }

    if (username) {
        newNote = {title: "Untitled",
                   owner: username,
                   content: "No content"};

        notesCollection.insert(newNote, reportInserted);
    } else {
        res.send("ERROR: Not Logged In");
    }
});


module.exports = router;
