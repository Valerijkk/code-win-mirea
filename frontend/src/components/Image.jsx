import React, { useState } from 'react';

const Image = ({ help, image, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div class="relative h-1/8 flex justify-center sm:text-xs md:text-xs lg:text-xs xl:text-xs 2xl:text-sm" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div class="w-1/2 flex flex-col justify-center">
                <button class="h-1/2" onClick={onClick}>
                    <image class="text-neutral-300 sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl" src={image}>
                        {image}
                    </image>
                </button>
            </div>

            {isHovered && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 -ml-4">
                    <div className="bg-black text-white p-2 rounded">
                        {help}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Image;