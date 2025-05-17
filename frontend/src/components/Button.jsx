import React, { useState } from 'react';

const Button = ({ text, help, image, index, isActive, toggleState }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        toggleState(index);
    };

    return (
        <button class={`relative inline-block mx-1 w-auto h-full rounded-3xl border text-sm ${isActive ? 'bg-sky-800' : 'bg-neutral-700'} ${isActive ? 'border-sky-700' : 'border-neutral-500'} ${isActive ? 'text-sky-400' : 'text-white'}`} onClick={handleClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div class="mx-2 flex">
                <div class="flex flex-col justify-center">
                    <image class="h-3/4 w-5 bg-white"> {/* src={`${image}`} posle vstavki kartinki uberite "w-5" i postavte norm sootnoshenie */}
                        
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