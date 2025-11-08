function Navbar() {
  return (
    // <nav className="bg-white border-b border-[#E0E0E0] flex flex-row justify-between px-[5%] items-center">
    //   <div className="flex flex-row items-center gap-2">
    //     <img src="/logo_starter.png" className="h-10"></img>
    //     <h1 className="text-xl font-inter ">Hungry Bear LLC</h1>
    //   </div>

    //   <div className="flex flex-row items-center gap-10 px-4 py-2">
    //     <a
    //       href="#"
    //       className="px-4 py-1 text-white bg-black rounded-md hover:bg-gray-300 hover:text-black"
    //     >
    //       Share
    //     </a>
    //     <div className="flex flex-row items-center gap-1 rounded-md hover:bg-gray-300 px-2 py-1">
    //       <button className="">Username</button>
    //       <img
    //         className="h-[20px] w-[20px]"
    //         src="/down-arrow.png"
    //         alt="Dropdown arrow"
    //       />
    //     </div>
    //   </div>
    // </nav>

    <nav className="top-0 w-full z-50 transition-all duration-300 backdrop-blur-sm border-b-2 border-b-[#78502C]">
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between items-center h-10 sm:h-12 lg:h-16">
          <div>
            <img
              src="../logo-starter.png"
              className="h-10 sm:h-12 lg:h-18"
              alt="Hungry Bear Logo"
            />
          </div>

          <button className="hover:cursor-pointer">
            <img
              src="image.png"
              alt="User Icon"
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
            />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
