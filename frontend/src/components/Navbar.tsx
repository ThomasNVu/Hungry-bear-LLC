function Navbar() {
  return (
    <nav className="bg-white border-b border-[#E0E0E0] flex flex-row justify-between px-[5%] items-center">
      <div className="flex flex-row items-center gap-2">
        <img src="/logo_starter.png" className="h-10"></img>
        <h1 className="text-xl font-inter ">Hungry Bear LLC</h1>
      </div>

      <div className="flex flex-row items-center gap-10 px-4 py-2">
        <a
          href="#"
          className="px-4 py-1 text-white bg-black rounded-md hover:bg-gray-300 hover:text-black"
        >
          Share
        </a>
        <div className="flex flex-row items-center gap-1 rounded-md hover:bg-gray-300 px-2 py-1">
          <button className="">Username</button>
          <img
            className="h-[20px] w-[20px]"
            src="/down-arrow.png"
            alt="Dropdown arrow"
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
