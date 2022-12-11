import "remixicon/fonts/remixicon.css";
import {
  Header,
  Home,
  New,
  Collection,
  Products,
  Brand,
  Footer,
  ScrollToTop,
} from "./components";
import {useState} from 'react'

function App() {
  const modes = ['light', 'dark']
const [mode, setMode] = useState(modes[0])

// const handleState = (e) => {
//   setMode(e);
// };

  return (
    <div className={[
      mode && `theme-${mode}`,
    ].filter(Boolean).join(' ')}>
      {/* navbar */}
      <Header mode={mode} setMode = {setMode}/>
      <main className="mainGLobal">
        {/*home*/}
        <Home />
        {/* new items */}
        <New />
        {/* collections */}
        <Collection />
        {/* products */}
        <Products />
        {/* brand */}
        <Brand />
        {/* footer */}
        <Footer />
      </main>
      {/* scroll to top */}
      <ScrollToTop/>
    </div>
  );
}

export default App;
