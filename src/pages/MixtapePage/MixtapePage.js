import React from "react";
import { Card, Form, Button } from "react-bootstrap";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CancelIcon from '@material-ui/icons/Cancel';
import CallSplitIcon from "@material-ui/icons/CallSplit";
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { Link } from "react-router-dom";
import { Multiselect } from 'multiselect-react-dropdown';
import { useQuery, useMutation } from "@apollo/client";
import YouTube from "react-youtube";

import Navbar from "../../components/Navbar/Navbar";
import IconButton from "../../components/IconButton/IconButton";
import SongCard from "../../components/SongCard/SongCard";
import AddSongModal from "../../components/Modals/AddSongModal"
import AddCollaboratorModal from "../../components/Modals/AddCollaboratorModal"
import MashMixtapeModal from "../../components/Modals/MashMixtapeModal";
import Comment from "../../components/Comments/Comment";
import { mixtapesClient, getMixtape, 
  addSongs as addSongsMut,
  editSongs as editSongsMut,
  addComment as addCommentMut,
  addReply as addReplyMut,
  createMixtapeFromBase as createMixtapeFromBaseMut,
  updateLikes as updateLikesMut,
  updateDislikes as updateDislikesMut,
  updateMixtapeTitle as updateMixtapeTitleMut,
  updateMixtapeDescription as updateMixtapeDescriptionMut,
  updateMixtapeGenres as updateMixtapeGenresMut,
  updateMixtapePrivate as updateMixtapePrivateMut,
  addListen
  } from "../../services/mixtapesService"; 

import {userClient, updateUserLikes as updateUserLikesMut, updateUserDislikes as updateUserDislikesMut, updateGenrePreferences as updateGenrePreferencesMut} from "../../services/userService";
import { useAuth } from "../../utils/use-auth";
import { useToast } from "../../utils/use-toast";
import { usePolling } from "../../utils/use-polling";

import "../Page.css";
import "./MixtapePageStyle.css";

const MixtapePage = (props) => {
  // Extract the mixtape id from the url
  let url = window.location.pathname.split("/");
  const id = url[url.length - 1];

  // Hook into the auth object
  const auth = useAuth();

  // Hook into notifications
  const toaster = useToast();

  // Hook into polling
  const polling = usePolling();
  if (id !== polling.mixtapeId){
    polling.startPolling(id);
  }

  /* ---------- HOOKS ---------- */
  // Mixtape editing
  const [editingMixtapeTitle, setEditingMixtapeTitle] = React.useState(false);
  const [editingMixtapeDescription, setEditingMixtapeDescription] = React.useState(false);
  const [editingSongs, setEditingSongs] = React.useState(false);
  const [editList, setEditList] = React.useState([]);
  const [editView, setEditView] = React.useState(null);

  // Song playing
  const [currentSongIndex, setCurrentSongIndex] = React.useState(0);
  const [autoplay, setAutoplay] = React.useState(0);

  // Commenting
  const [commentText, setCommentText] = React.useState("");
  const [replyIndex, setReplyIndex] = React.useState(-1);

  //request pending
  const [requestPending, setRequestPending] = React.useState(false);

  // // Forking
  // const [isPublic, setPublic] = React.useState(false);

  const [tempTitle, setTempTitle] = React.useState("");
  const [tempDescription, setTempDescription] = React.useState("");

  const [mixtapePrivate, setMixtapePrivate] = React.useState(null)

  const [hasListened, setHasListened] = React.useState(false);

  /* ---------- QUERIES ---------- */


  /* ---------- MUTATIONS ---------- */
  const [addSongsMutation] = useMutation(addSongsMut, {client: mixtapesClient});
  const [addCommentMutation] = useMutation(addCommentMut, {client: mixtapesClient});
  const [addReplyMutation] = useMutation(addReplyMut, {client: mixtapesClient});
  const [editSongsMutation] = useMutation(editSongsMut, {client: mixtapesClient});
  const [createMixtapeFromBase] = useMutation(createMixtapeFromBaseMut, {client: mixtapesClient, onCompleted: (data) => {
    // Notify the user a mixtape was created
    toaster.notify("Mixtape Forked", <>You just forked a mixtape!</>);
  }});
  const [updateLikesMutation] = useMutation(updateLikesMut, {client: mixtapesClient});
  const [updateDislikesMutation] = useMutation(updateDislikesMut, {client: mixtapesClient});
  const [updateMixtapeTitleMutation] = useMutation(updateMixtapeTitleMut, {client: mixtapesClient});
  const [updateMixtapeDescriptionMutation] = useMutation(updateMixtapeDescriptionMut, {client: mixtapesClient});
  const [updateMixtapeGenresMutation] = useMutation(updateMixtapeGenresMut, {client: mixtapesClient});
  const [updateMixtapePrivateMutation] = useMutation(updateMixtapePrivateMut, {client: mixtapesClient});

  const [updateGenrePreferencesMutation] = useMutation(updateGenrePreferencesMut, {client: userClient});

  const [updateUserLikesMutation] = useMutation(updateUserLikesMut, {client: userClient, onCompleted: (data) => {
    auth.getUser({likedMixtapes: data.setLikeMixtape.likedMixtapes, dislikedMixtapes: data.setLikeMixtape.dislikedMixtapes});
    setRequestPending(false);
  }});

  const [updateUserDislikesMutation] = useMutation(updateUserDislikesMut, {client: userClient, onCompleted: (data) => {
    auth.getUser({likedMixtapes: data.setDislikeMixtape.likedMixtapes, dislikedMixtapes: data.setDislikeMixtape.dislikedMixtapes});
    setRequestPending(false);
  }});

  const [addListenMutation] = useMutation(addListen, {client: mixtapesClient});

  /* ---------- CALLBACKS ---------- */
  // Callback for when we add songs to the backend
  const addSongs = (songs) => {
    addSongsMutation({variables: {id: id, songs: songs}});
  }

  // Callback for when we submit a comment
  const submitComment = (event) => {
    // Don't reload page
    event.preventDefault();

    // Add a comment to the backend (and update when it returns)
    const comment = {
      userId: auth.user._id,
      username: auth.user.username,
      content: commentText
    };
    addCommentMutation({variables: {id: polling.data.mixtape._id, comment: comment}});

    // Remove comment text
    setCommentText("");
  }

  const submitReply = (commentId, replyText) => {
        // Add a comment to the backend (and update when it returns)
        const reply = {
          userId: auth.user._id,
          username: auth.user.username,
          content: replyText
        };

        addReplyMutation({variables: {id: polling.data.mixtape._id, commentId: commentId, reply: reply}});
    
        // Remove comment text
        setReplyIndex(-1);
  }

  // Callback for when the current song is done playing
  const changeToNextSong = (event) => {
    if(!polling.loading){
      let index = (currentSongIndex + 1) % polling.data.mixtape.songs.length;

      setCurrentSongIndex(index);

      if(index !== 0){
        setAutoplay(1);
      } else {
        setAutoplay(0);
      }

      // Player state won't update if we play the same song twice in a row. Handle this:
      if(index !== 0 && polling.data.mixtape.songs[index].youtubeId === polling.data.mixtape.songs[index-1].youtubeId){
        event.target.seekTo(0);
      }
    }
  }

  //Adding a mixtape
  const addMixtape = () => {
    createMixtapeFromBase({variables: {
      ownerId: auth.user._id, 
      ownerName: auth.user.username,
      title: polling.data.mixtape.title, 
      description: polling.data.mixtape.description, 
      genres: polling.data.mixtape.genres, 
      image: polling.data.mixtape.image, 
      songs: polling.data.mixtape.songs.map(song =>({youtubeId: song.youtubeId, name: song.name}))
    }});
  }

  const moveSongEarlier = (index) => {
    if (!polling.loading){
      if (index !== 0){
        let tempSongsArr = editList.slice();
        let tempSong = tempSongsArr[index];
        tempSongsArr[index] = tempSongsArr[index-1];
        tempSongsArr[index-1] = tempSong;
        setEditList(tempSongsArr);
        let list = editList.map (song => 
          (
            {youtubeId: song.youtubeId,
            name: song.name,
            }
          )
        )
        editSongsMutation({variables: {id: id, songs: list}});
      }
    }
  }

  const moveSongLater = (index) => {
    if (!polling.loading){
      if (index !== polling.data.mixtape.songs.length-1){
        let tempSongsArr = editList.slice();
        let tempSong = tempSongsArr[index];
        tempSongsArr[index] = tempSongsArr[index+1];
        tempSongsArr[index+1] = tempSong;
        setEditList(tempSongsArr);
        let list = editList.map (song => 
          (
            {youtubeId: song.youtubeId,
            name: song.name,
            }
          )
        )
        editSongsMutation({variables: {id: id, songs: list}});
      }
    }
  }
  
  const enableEditing = () =>{
    setEditingSongs(true);
    setEditList(polling.data.mixtape.songs.slice());

  }

  const disableEditing = () => {
    confirmRemoveSongs();
    setEditingSongs(false);

  }

  const cancelEditing = () => {
    setEditingSongs(false);
  }

  const removeSong = (index) => {
    let list = editList.filter((song, i) => i !== index);
    setEditList(list);
  }

  const confirmRemoveSongs = () => {
    let list = editList.map (song => ({youtubeId: song.youtubeId, name: song.name})); 
          
    editSongsMutation({variables: {id: id, songs: list}});
    setEditList([]);
  }

  const userCanEdit = () => {
    if (!polling.loading){
      if (polling.data.mixtape.ownerId === auth.user._id){ return true; }
      if (polling.data.mixtape.collaborators.reduce((acc, x) => (x.userId === auth.user._id && x.privilegeLevel === "edit") || acc, false)){ return true; }
      return false;
    }
  }

  const incrementLikes = () => {
    if (!polling.loading){
      if (!requestPending){
        setRequestPending(true);
        let wasDisliked = false;
        if (auth.user.dislikedMixtapes.includes(id)){
          updateDislikesMutation({variables: {id: id, incAmount: -1}});
          wasDisliked = true;
        }
        if (auth.user.likedMixtapes.includes(id)){
          updateLikesMutation({variables: {id: id, userId: auth.user._id, incAmount: -1}});
          updateUserLikesMutation({variables: {id: auth.user._id, mixtapeId: id, mixtapeGenres: polling.data.mixtape.genres, genrePreferences: auth.user.genrePreferences.map(x => ({genre: x.genre, val: x.val})), like: false, wasDisliked}});
        }
        else{
          updateLikesMutation({variables:{id: id, userId: auth.user._id, incAmount: 1}});
          updateUserLikesMutation({variables: {id: auth.user._id, mixtapeId: id, mixtapeGenres: polling.data.mixtape.genres, genrePreferences: auth.user.genrePreferences.map(x => ({genre: x.genre, val: x.val})), like: true, wasDisliked}});
        }
      }
    }
  }

  const incrementDislikes = () => {
    if (!polling.loading){
      if (!requestPending){
        setRequestPending(true);
        let wasLiked = false;
        if (auth.user.likedMixtapes.includes(id)){
          updateLikesMutation({variables: {id: id, userId: auth.user._id, incAmount: -1}});
          wasLiked = true;
        }
        if (auth.user.dislikedMixtapes.includes(id)){
          updateDislikesMutation({variables: {id: id, incAmount: -1}});
          updateUserDislikesMutation({variables: {id: auth.user._id, mixtapeId: id, mixtapeGenres: polling.data.mixtape.genres, genrePreferences: auth.user.genrePreferences.map(x => ({genre: x.genre, val: x.val})), dislike: false, wasLiked}});
        }
        else{
          updateDislikesMutation({variables:{id: id, incAmount: 1}});
          updateUserDislikesMutation({variables: {id: auth.user._id, mixtapeId: id, mixtapeGenres: polling.data.mixtape.genres, genrePreferences: auth.user.genrePreferences.map(x => ({genre: x.genre, val: x.val})), dislike: true, wasLiked}});
        }
      }
    }
  }

  const handleListen = () => {
    if(!hasListened){
      addListenMutation({variables: {id: id, userId: auth.user._id}});
      setHasListened(true);
    }
  }

  if (!polling.loading && editView==null){
    setEditView(userCanEdit())
  }

  const genres=[
    {value: "Alternative Rock"},
    {value: "Ambient"},
    {value: "Blues"},
    {value: "Chill"},
    {value: "Classical"},
    {value: "Country"},
    {value: "Drum and Bass"},
    {value: "Dubstep"},
    {value: "Electronic"},
    {value: "Folk"},
    {value: "Hip Hop"},
    {value: "House"},
    {value: "Indie"},
    {value: "Instrumental"},
    {value: "Jazz"},
    {value: "LoFi"},
    {value: "Metal"},
    {value: "Musical Theatre"}, 
    {value: "New Wave"},
    {value: "Other"},
    {value: "Pop"},
    {value: "Reggae"},
    {value: "Rock"}, 
    {value: "Ska"},
    {value: "Soundtrack"},
    {value: "Swing"}
  ];
  const [options] = React.useState(genres);

  const editTitle = () => {
    setEditingMixtapeTitle(false);
    if(tempTitle.length !== 0){
      updateMixtapeTitleMutation({variables: {id: polling.data.mixtape._id, title: tempTitle}});
    }
    setTempTitle("");
  }

  const editDescription = () => {
    setEditingMixtapeDescription(false);
    if(tempDescription.length !== 0){
      updateMixtapeDescriptionMutation({variables: {id: polling.data.mixtape._id, description: tempDescription}});
    }
    setTempDescription("");
  }

  const updateMixtapePrivate = () => {
    updateMixtapePrivateMutation({variables: {id: polling.data.mixtape._id, private: !mixtapePrivate}});
    setMixtapePrivate(!mixtapePrivate);
  }

  const addGenre = (selectedList, selectedItem) => {
    var tempList = [];
    for(var i = 0; i < selectedList.length; i++){
      tempList.push(selectedList[i].value);
    }

    updateMixtapeGenresMutation({variables: {id: polling.data.mixtape._id, genres: tempList}});
    editPreSelected(tempList);
    tempList = [];
  }

  const removeGenre = (selectedList, selectedItem) => {
    var tempList = [];
    for(var i = 0; i < selectedList.length; i++){
      tempList.push(selectedList[i].value);
    }

    updateMixtapeGenresMutation({variables: {id: polling.data.mixtape._id, genres: tempList}});
    editPreSelected(tempList);
    tempList = [];
  }

  function editPreSelected (selectedList) {
    var tempPreSelected = []
    for(var i = 0; i < selectedList.length; i++){
      tempPreSelected.push({value: selectedList[i]});
    }
    preSelected = tempPreSelected;
  }

  var preSelected = [];
  if(!polling.loading){
    editPreSelected(polling.data.mixtape.genres)
  }

  if (!polling.loading && mixtapePrivate == null){
    setMixtapePrivate(polling.data.mixtape.private);
  }

  console.log(auth.user.genrePreferences);

  return (
    <div className="page-container">
      <Navbar />
      <Card className="page-content">
        {/* The Mixtape Header */}
        {!polling.loading &&
        <Card.Header className="mixtape-page-header">
          {editView ? (
          <Form.Group controlId="formBasicCheckbox" style={{display: "flex", flexDirection: "row"}}>
            <Form.Check type="checkbox" defaultValue="" checked={!mixtapePrivate} onChange={updateMixtapePrivate}/>
            <Form.Label style={{paddingLeft: "1vw"}}>Public</Form.Label>
          </Form.Group>
          ):
          (<Form.Group controlId="formBasicCheckbox" style={{display: "flex", flexDirection: "row", alignItems:"center"}}>
            <div> </div>
          </Form.Group>)
          }
          {/*Mixtape's Title*/}
          <div className="mixtape-title-container">
            {editView &&
              <div>
              {!editingMixtapeTitle ? (
                <IconButton component={<EditIcon />}
                  callback={() => setEditingMixtapeTitle(true)}/>) 
                : (
                <IconButton component={<SaveIcon />}
                  //callback={() => setEditingMixtapeTitle(false)}
                  onClick={editTitle}
                  />
              )}
              </div>
            }
            <div className="mixtape-page-title">
              {!editView ? 
              (
                <h4>{polling.data.mixtape.title}</h4>
              ): 
              (
                <Form.Control
                type="input"
                className="mixtape-title"
                defaultValue={!polling.loading && polling.data.mixtape.title}
                disabled={!editingMixtapeTitle}
                onChange={event => setTempTitle(event.target.value)}
                maxLength={50}
                />
              )}
              {/* Mixtape's Owner */}
              {!polling.loading && <Link to={"/User/" + polling.data.mixtape.ownerId}><div className="mm-link-blue">{polling.data.mixtape.ownerName}</div></Link>}
            </div>
          </div>

          <div>
            <MashMixtapeModal mixtape={!polling.loading ? polling.data.mixtape : null} />
            <IconButton component={<CallSplitIcon onClick={addMixtape}/>} />
            {(!polling.loading && auth.user._id === polling.data.mixtape.ownerId) &&
            <AddCollaboratorModal mixtape={!polling.loading ? polling.data.mixtape : null}/>
            }
          </div>
        </Card.Header>}

        {/* The Mixtape Body */}
        <Card.Body className="scroll-content">
          <div className="song-and-video">
            <div className="video-container">
              {!polling.loading && <YouTube className="video-preview"
                onPlay={handleListen}
                videoId={polling.data.mixtape.songs.length > 0 ? polling.data.mixtape.songs[currentSongIndex].youtubeId : ""}
                onEnd={changeToNextSong} opts={{playerVars: { autoplay: autoplay}}}
              />}
              <div className="likes-listens">
                {!polling.loading &&
                <div>
                  <IconButton component={<ThumbUpIcon style={auth.user.likedMixtapes.includes(id) ? ({color:"var(--primary-color)"}):({})}/>} onClick={incrementLikes} />
                  <IconButton component={<ThumbDownIcon style={auth.user.dislikedMixtapes.includes(id) ? ({color:"var(--warning-color)"}):({})}/>} onClick={incrementDislikes} />
                </div>
                }
                <div>
                  Likes: {!polling.loading && polling.data.mixtape.likes}
                </div>
                <div>
                  Dislikes: {!polling.loading && polling.data.mixtape.dislikes}
                </div>
                <div>
                  Listens: {!polling.loading && polling.data.mixtape.listens}
                </div>
              </div>

              {editView ? 
                (
                  <div>
                    Genres: <Multiselect 
                      options={options}
                      displayValue="value"
                      selectedValues={preSelected}
                      onSelect={addGenre} 
                      onRemove={removeGenre}
                      selectionLimit={5}
                      avoidHighlightFirstOption={true}
                      />
                  </div>
                ):
                (
                  <div>
                    Genres: {!polling.loading && <span>{polling.data.mixtape.genres.join(", ")}</span>}
                  </div>
                )
              }
            </div>


            <div className="song-container">
              <div style={{display:"flex", flexDirection:"row", justifyContent:"center", alignItems:"center"}}>
                {editView && (!editingSongs ? (
                  <IconButton component={<EditIcon />}
                    callback={enableEditing}/>) 
                  : (
                  <IconButton component={<SaveIcon />}
                    callback={disableEditing}/>
                ))}
                {editView && (!editingSongs ? 
                  (<div/>) 
                    : 
                  (
                    <div>
                      {/* <Button variant="primary" className="mm-btn-alt">Cancel Changes </Button> */}
                      <IconButton component={<NotInterestedIcon />} callback={cancelEditing}/>
                     </div>
                  )
                )}
                <div className="space-below">Songs</div>
                
              </div>
              <div className="scroll-content song-list space-below">
                {!polling.loading && !editingSongs && polling.data.mixtape.songs.map((song, index) => (
                  <SongCard song={song} key={index} songIndex={polling.data.mixtape.songs.indexOf(song)} editingSongs={editingSongs} removeCallback={() => removeSong(index)} moveSongEarlierCallback={() => moveSongEarlier(index)} moveSongLaterCallback={() => moveSongLater(index)}/>
                ))}
                {!polling.loading && editingSongs && editList.map((song, index) => (
                  <SongCard song={song} key={index} songIndex={polling.data.mixtape.songs.indexOf(song)} editingSongs={editingSongs} removeCallback={() => removeSong(index)} moveSongEarlierCallback={() => moveSongEarlier(index)} moveSongLaterCallback={() => moveSongLater(index)} />
                ))}
              </div>
              <div>
              {editView && !polling.loading && <AddSongModal originalSongLength={polling.data.mixtape.songs.length} addSongsCallback={addSongs} disabledButton={editingSongs} />}
              </div>
              
            </div>
          </div>

          {/* Mixtape Description */}
          <div>
            {editView &&
            <span>
              {!editingMixtapeDescription ? (
                <IconButton component={<EditIcon />}
                  callback={() => setEditingMixtapeDescription(true)}/>) 
                : (
                <IconButton component={<SaveIcon />}
                  onClick={editDescription}
                  />
              )}
              </span>
            }
            Description:
            {!polling.loading && <div>
              <Form.Control
                as="textarea"
                rows={5}
                className="mixtape-description"
                defaultValue={polling.data.mixtape.description}
                disabled={!editingMixtapeDescription}
                onChange={event => setTempDescription(event.target.value)}
                maxLength="500"
              />  
            </div>}
          </div>

          <div className="comment-section-container space-above">
            <div>
              <Card className="comments-card">
                <Card.Header>
                  <div className="space-above" style={{display:"flex", flexDirection:"row", justifyContent:"space-evenly", alignItems:"center"}}>
                    <div>Leave a Comment: </div>
                    <Form onSubmit={submitComment}>
                      <Form.Control
                        type="input"
                        value={commentText}
                        placeholder={"Write your comment here..."}
                        style={{width:"80% !important"}}
                        onChange={event => setCommentText(event.target.value)}
                        maxLength={250}
                      />
                    </Form>
                  </div>
                </Card.Header>
                <Card.Body className="scroll-content comments-section">
                  {!polling.loading && polling.data.mixtape.comments.map((comment, index) =>
                    <Comment
                      comment={comment}
                      startReply={() => setReplyIndex(index)}
                      replying={index === replyIndex}
                      submitReply={(replyText) => submitReply(comment.id, replyText)}
                  />)}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Card.Body>
        <Card.Footer></Card.Footer>
      </Card>
    </div>
  );
}

export default MixtapePage;