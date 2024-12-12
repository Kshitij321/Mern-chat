//1 steps to istall tailwindcss
//1-> npm i tailwindcss autoprefixer postcss  (tailwind uses these extra tools)
//2->npx tailwindcss init -p (npx command for running any package without instaling globally only by its name)
//this creates the config files for ttailwind
//3->then we tell tailwind which file to look for, to apply styles
//in the tailwindconfig files "./src/*.jsx"  (see all jsx files inside the src folder)
//4->add @tailwind base @tailwind components @tailwind utilities inside the index.css file

//NOTE--->  IMPORTANT
//evey jsx element should start with thew capital letter (camel case)
//and file name not necessarily match with the function name

import Routes from "./Routes";
import { UserContextProvider } from "./UserContext";

function App() {
  return (
    <>
      <UserContextProvider>
        <Routes />
      </UserContextProvider>
    </>
  );
}

export default App;
