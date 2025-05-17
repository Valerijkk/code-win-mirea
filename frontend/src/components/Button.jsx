import React, { useState } from 'react';

const Button = ({ text, image }) => {
    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        setIsActive(!isActive);
    };

    return (
        <button class={`mx-1 w-auto h-full rounded-3xl border text-sm ${isActive ? 'bg-sky-800' : 'bg-neutral-700'} ${isActive ? 'border-sky-700' : 'border-neutral-500'} ${isActive ? 'text-sky-400' : 'text-white'}`} onClick={handleClick}>
            <div class="mx-2 flex">
                <div class="flex flex-col justify-center">
                    <image class="h-3/4 w-5 bg-white"> {/* src={`${image}`} posle vstavki kartinki uberite "w-5" i postavte norm sootnoshenie */}
                        
                    </image>
                </div>
                <div class="ml-2">
                    {text}
                </div>
            </div>
        </button>
    );
};

export default Button;