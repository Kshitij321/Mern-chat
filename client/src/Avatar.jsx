const Avatar = ({ username, userId, online }) => {
  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-purple-200",
    "bg-yellow-200",
    "bg-teal-200",
    "bg-pink-200",
    "bg-orange-200",
  ];

  const userIdbase10 = parseInt(userId, 16);
  const colorIndex = userIdbase10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={`w-8 h-8 relative rounded-full flex items-center ${color}`}>
      <div className="text-center w-full opacity-70">{username[0]}</div>
      {online && (
        <div className="absolute bg-green-400 rounded-full w-3 h-3 bottom-0 left-5 right-0 top-6 border border-white"></div>
      )}
      {!online && (
        <div className="absolute bg-gray-400 rounded-full w-3 h-3 bottom-0 left-5 right-0 top-6 border border-white"></div>
      )}
    </div>
  );
};

export default Avatar;
