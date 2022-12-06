import "remixicon/fonts/remixicon.css";
import { Header,Home, New,Collection,Products, Brand } from "./components";

function App() {

  return (
    <div className="">
      {/* navbar */}
      <Header />
      <main className="mainGLobal">
        {/*home*/}
        <Home />
        {/* new items */}
        <New/>
        {/* collections */}
        <Collection/>
        {/* products */}
        <Products/>
        {/* brand */}
        <Brand/>
      </main>
    </div>
  );
}

export default App;
