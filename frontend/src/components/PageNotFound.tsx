import { Link } from "react-router-dom";

function PageNotFound() {
  return (
    <div>
      <h1>Not Found Page</h1>
      <Link to={"/"}>
        <button>Go Back Home</button>
      </Link>
    </div>
  );
}

export default PageNotFound;
