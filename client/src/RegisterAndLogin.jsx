import { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";

const RegisterAndLogin = () => {
  const { setUsername: setLoggedinUsername, setId } = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");

  const handleRegisterAndLogin = async (e) => {
    e.preventDefault();
    const url = isLoginOrRegister === "register" ? "register" : "login";
    try {
      //see in axios syntax we can directly send the data with the post call
      const { data } = await axios.post(
        `https://mern-chat-qxu7.onrender.com/${url}`,
        { username, password },
        {
          withCredentials: true,
        }
      );
      setLoggedinUsername(username);
      setId(data.id);
      console.log(data.message);
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="flex items-center bg-blue-50 h-screen">
      <form
        action=""
        onSubmit={handleRegisterAndLogin}
        className="w-64 mx-auto mb-12"
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="username"
          className="rounded-sm p-2 block border w-full mb-2"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          className="rounded-sm p-2 block border w-full mb-2"
        />
        <button
          type="submit"
          className="bg-blue-500 block w-full text-white rounded-sm"
        >
          {isLoginOrRegister == "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister == "register" && (
            <div>
              Already a member?
              <button
                onClick={() => {
                  setIsLoginOrRegister("login");
                }}
              >
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister == "login" && (
            <div>
              Dont have an account?
              <button
                onClick={() => {
                  setIsLoginOrRegister("register");
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterAndLogin;
