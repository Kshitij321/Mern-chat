import { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";

import { useRef } from "react";
import axios from "axios";
import Contact from "./Contact";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinepeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();
  const [offlinepeople, setOfflinePeople] = useState({});

  const showOnlinePeople = (peopleArray) => {
    const updatedPeople = {}; // Create a new object
    peopleArray.forEach(({ userId, username }) => {
      updatedPeople[userId] = username;
    });
    setOnlinepeople(updatedPeople); // Update state directly
  };
  const messagesWithoutDupes = uniqBy(messages, "_id");
  //event handler fucntion for when an message send event occurs
  //for which we have written the addEventListener function
  //handle message when we recive it
  const handleMessage = (ev) => {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId)
        setMessages(prev => ([...prev, { ...messageData }]));
    }
  };

  //call to db to fetch the messages
  //and set the array of messages to the data recieved from the DB
  useEffect(() => {
    if (selectedUserId)
      axios
        .get(`http://localhost:4000/messages/${selectedUserId}`, {
          withCredentials: true,
        })
        .then((res) => {
          setMessages(res.data);
        });
  }, [selectedUserId]);

  const handleLogout = () => {
    axios
      .post("http://localhost:4000/logout", { withCredentials: true })
      .then(() => {
        setWs(null);
        setId(null);
        setUsername(null);
        
      });
  };
  //how to send a message from our side
  // const handleSendMessage = (ev, file = null) => {
  //   if (ev) ev.preventDefault();
    
  //   ws.send(
  //     JSON.stringify({
  //       text: newMessageText,
  //       recipient: selectedUserId,
  //       file,
  //     })
      
  //   );
  //   // setNewMessageText("")
  //   // setMessages((prev) => [
  //   //   ...prev,
  //   //   {
  //   //     text: newMessageText,
  //   //     isOur: true,
  //   //     sender: id,
  //   //     recipient: selectedUserId,
  //   //     _id: Date.now(),
  //   //   },
  //   // ]);
  //   //set the text,isOur,sender and reciever so we see them on screen
  //   if (file) {
  //     axios
  //       .get(`http://localhost:4000/messages/${selectedUserId}`, {
  //         withCredentials: true,
  //       })
  //       .then((res) => {
  //         setMessages(res.data);
  //       });
  //   } else {
  //     setNewMessageText("");
  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         text: newMessageText,
  //         isOur: true,
  //         sender: id,
  //         recipient: selectedUserId,
  //         _id: Date.now(),
  //       },
  //     ]);
  //   }
  // };


  const handleSendMessage = (ev, file = null) => {
    if (ev) ev.preventDefault();
  
    ws.send(
      JSON.stringify({
        text: newMessageText,
        recipient: selectedUserId,
        file,
      })
    );
  
    setNewMessageText("");
  
    // Temporarily show the message before confirming
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        isOur: true,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  
    if (file) {
      // Introduce a timeout to wait for the response
      setTimeout(() => {
        axios
          .get(`http://localhost:4000/messages/${selectedUserId}`, {
            withCredentials: true,
          })
          .then((res) => {
            // Update state after confirming data arrival
            setMessages(res.data);
          });
      }, 145); // Adjust timeout duration as needed
    }
  };
  
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);
  //to connect to the websocket
  //see "it is websocket"  NOT 'websocketserver'
  //addEventListener used on clinet side
  //.on on server side
  useEffect(() => {
    axios
      .get(`http://localhost:4000/people`, { withCredentials: true })
      .then((res) => {
        const offlinepeopleArr = res.data
          .filter((p) => p._id !== id) // removing our id from all people
          .filter((c) => !Object.keys(onlinePeople).includes(c._id));
        //remove all online people from 'all people' ,by checking if their id is not present on the object
        //onlinepeople
        const offlinepeople = {};
        offlinepeopleArr.forEach((p) => {
          offlinepeople[p._id] = p;
        });
        setOfflinePeople(offlinepeople);
      });
  }, [onlinePeople]);

  useEffect(() => {
    connectToWs();
  }, []);

  //when connection closes then again connect to ws by calling this fucntion again
  //hence connection persists even after the refresh
  const connectToWs = () => {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () =>
      setTimeout(() => {
        console.log("Disconnected. Trying to Reconnect");
        connectToWs();
      }, 1000)
    );
  };

  const handleSendFile = (ev) => {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      handleSendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  };
  //take object of all online user
  //delete the current logged in user from it
  //to get all online user other than current user
  const onlinePeopleEcluOurUser = { ...onlinePeople };
  delete onlinePeopleEcluOurUser[id];
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 pl-4 pt-4 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeopleEcluOurUser).map((userId) => (
            <Contact
              id={userId}
              username={onlinePeopleEcluOurUser[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={true}
            />
          ))}
          {Object.keys(offlinepeople).map((userId) => (
            <Contact
              id={userId}
              username={offlinepeople[userId].username}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={false}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-7"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 py-2 px-2 bg-blue-100 border rounded-sm"
          >
            logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full justify-center items-center">
              <div className="text-gray-300">
                &larr;Select a person from the left
              </div>
            </div>
          )}
          {selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 bottom-4 left-0 right-0">
                {messagesWithoutDupes.map((msg) => (
                  <div
                    key={msg._id}
                    className={
                      " " + (msg.sender === id ? "text-right" : "text-left")
                    }
                  >
                    <div
                      className={
                        " text-left inline-block p-2 my-2 rounded-md text-sm " +
                        (msg.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      {msg.text}
                      {msg.file && (
                        <div className="">
                          <a
                            className="underline flex items-center gap-1"
                            href={`http://localhost:4000/uploads/${msg.file}`}
                            target="_blank"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {msg.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {selectedUserId && (
          <form className="flex gap-2" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              placeholder="type your message here"
              className="bg-white rounded-sm flex-grow p-2"
            />
            <label
              className="bg-blue-200 cursor-pointer p-2 text-gray-600 rounded-sm border-blue-200"
              type="button"
            >
              <input type="file" className="hidden" onChange={handleSendFile} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
