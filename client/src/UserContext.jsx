import axios from "axios";
import { createContext, useEffect, useState } from "react";
//user context created
const UserContext = createContext();
//pick the components wihch  the userContextProvider will be wrapping
//and provide the values using .provider


const UserContextProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);
  useEffect(()=>{
    axios.get('http://localhost:4000/profile',{withCredentials:true}).then((res)=>{
         setId(res.data.id);
         setUsername(res.data.username);
    })
  },[])
  
  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
};


export {UserContext,UserContextProvider};
