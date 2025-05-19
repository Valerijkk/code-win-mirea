import React, { useState } from 'react';

const Button = ({ text, help, image, index, isActive, toggleState }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        toggleState(index);
    };

    return (
        <button class={`relative inline-block mx-1 w-auto h-full rounded-3xl border sm:text-xs md:text-xs lg:text-xs xl:text-xs 2xl:text-sm ${isActive ? 'bg-blue-700' : 'bg-neutral-700'} ${isActive ? 'border-blue-600' : 'border-neutral-500'} ${isActive ? 'text-blue-300' : 'text-white'}`} onClick={handleClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div class="sm:mx-1 md:mx-1 lg:mx-1 xl:mx-2 2xl:mx-2 flex">
                <div class="flex flex-col justify-center">
                    <image class="h-3/4 sm:w-1 md:w-2 lg:w-3 xl:w-4 2xl:w-5 bg-white"> {/* src={`${image}`} posle vstavki kartinki uberite "w-5" i postavte norm sootnoshenie */}
                        
                    </image>
                </div>
                <div class="ml-2">
                    {text}
                </div>
            </div>

            {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                    <div className="bg-black text-white p-2 rounded">
                        {help}
                    </div>
                </div>
            )}
        </button>
    );
};

export default Button;