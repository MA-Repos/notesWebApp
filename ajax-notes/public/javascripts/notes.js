$(function() {
    var insertNotesIntoDOM = function(userNotes) {
        var i;

        $(".notes").remove();
        for (i=0; i < userNotes.length; i++) {
            console.log("Adding note " + i);
            $("#notesList").append('<li class="notes"> <div>' + 
                                   userNotes[i].title + ": " +
                                   '<button type="button" class="editButton"' +
				   'id="edit' + i + '">' + '[edit]</button>' +
                                   '<p>' + userNotes[i].content + '</p>' +
                                   "</li>");
            $("#edit" + i).click(userNotes[i], editNote);
        }
        $( ".notes p" ).each(function(){

          //First escape all html tags
          var htmlString = $( this ).html();
          $( this ).text( htmlString );
           

           //then search for specific tag and replace it as href html
          var specificTagSearch=$( this ).html()
          specificTagSearch=specificTagSearch.replace(/\[(\S+)\s+([^\]]+)\]/gi,'<a href=\"$1\">$2</a>');

           //if match found make it html else regular text
          if (specificTagSearch) {
            $(this).html(specificTagSearch)
          }else{
              $(this).text(specificTagSearch)

          }

        });

    }

    var getAndListNotes = function() {
        $.getJSON("/getNotes", insertNotesIntoDOM);
    }

    var updateNoteOnServer = function(event) {
        var theNote = event.data;
        theNote.title = $("#noteTitle").val();
        theNote.content = $("#noteContent").val();
        noteListing();
        $.post("/updateNote",
               {"id": theNote._id,
                "title": theNote.title,
                "content": theNote.content},
               getAndListNotes);
    }

    var deleteNoteOnServer = function(event) {
      var theNote = event.data;
        theNote.title = $("#noteTitle").val();
        theNote.content = $("#noteContent").val();

        //Confirmation notice
      if (window.confirm("Delete note: "+theNote.title)) { 
        noteListing();
        $.post("/delete",
               {"id": theNote._id,
                "title": theNote.title,
                "content": theNote.content},
               getAndListNotes);
      }
        
    }
    var confirmedRes = function(result){

        if (result.msg.indexOf("ERROR") > -1) {
           // report that we couldn't change username
           window.confirm(result.UsrExits+" -username already exists!")
        } else {
            //if successful reload the page and redraw listings
            location.reload();
        }
    }
    var confirmUser = function(event) {
      var theNote=event.data;

      var newUsr=$("#username").val();
      //Post to Server
      var result=$.post("/changeusername",
                {newUsr:newUsr},
               confirmedRes);
    }

    var ChangeUserNameServer = function(event) {
      
      var theNote = event.data;

      $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="ChangeUserNameDiv"></div>');
      $("#ChangeUserNameDiv").append('<h2>Change Username:</h2>');

      $("#ChangeUserNameDiv").append('<input type="text" id="username" name="username" placeholder="Enter New Username"></input><br>')
      $("#ChangeUserNameDiv").append('<button type="button" id="doChangeUsername">ChangeUsername</button>')
      var newUsr=$("#username").val();
      //submit
      $("#doChangeUsername").click(theNote,confirmUser);
      //Cancel
      $("#ChangeUserNameDiv").append('<button type="button" id="cancelUsernameChange">' +
                                 'Cancel</button>')
      $("#cancelUsernameChange").click(noteListing);        
        
       
    }

    var editNote = function(event) {
        var theNote = event.data;

        $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="editNoteDiv"></div>');
        $("#editNoteDiv").append('<h2>Edit Note</h2>');

        $("#editNoteDiv").append('<div><input type="text" ' +
                                 'id="noteTitle"></input></div>');
        $("#noteTitle").val(theNote.title);

        $("#editNoteDiv").append('<div><textarea cols="40" rows="5" ' +
                                 'id="noteContent" wrap="virtual">' +
                                 '</textarea></div>');
        $("#noteContent").val(theNote.content);


        $("#editNoteDiv").append('<button type="button" id="updateNote">' +
                                 'Update</button>')
        $("#updateNote").click(theNote, updateNoteOnServer);
        
        $("#editNoteDiv").append('<button type="button" id="delete">' +
                                 'Delete</button>')
        $("#delete").click(theNote, deleteNoteOnServer);

        $("#editNoteDiv").append('<button type="button" id="cancelUpdate">' +
                                 'Cancel</button>')
        $("#cancelUpdate").click(noteListing);
    }
    var UserNameNote = function(result) {
        var theNote = {"title": "",
                       "content": ""};

        if (result.indexOf("ERROR") == -1) {
            theNote._id = result;
            ChangeUserNameServer({data: theNote});  //faking event object
        } else {
            // report that we couldn't create a note        
            noteListing();
        }
    }
    
    var editNewNote = function(result) {
                        console.log("Edit....::"+JSON.stringify(theNote));

        var theNote = {"title": "",
                       "content": ""};

        if (result.indexOf("ERROR") == -1) {
            theNote._id = result;
            editNote({data: theNote});  //faking event object
        } else {
            // report that we couldn't create a note        
            noteListing();
        }
    }

    var newNote = function() {
        $.post("/newNote", editNewNote);
    }
    
    var noteListing = function() {
        $(".notesArea").replaceWith('<div class="notesArea" ' +
                                    'id="listNotesDiv">');        
  
        $("#listNotesDiv").append('<ul id="notesList">' +
                                  '<li class="notes">Loading Notes...</li>' +
                                  '</ul>');

        $("#listNotesDiv").append('<button id="newNote" type="button">' +
                                  'New Note</button>');
        $("#newNote").click(newNote);

        $("#listNotesDiv").append('<button id="refreshNotes" type="button">' +
                                  'Refresh</button>');
        $("#refreshNotes").click(getAndListNotes);

        $("#listNotesDiv").append('<button id="changeusername" type="button">' +
                                  'Change UserName</button>');
        //
        var temp=$.getJSON("/getNotes");
        $("#changeusername").click(temp,ChangeUserNameServer);

        getAndListNotes();
    }

    noteListing();
});
