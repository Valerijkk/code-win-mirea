import React, { useState } from 'react';

const Image = ({ help, image }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div class="relative h-1/8 flex justify-center text-sm" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div class="w-1/2 flex flex-col justify-center">
                <button class="relative h-1/2 bg-white">
                    <image src={image}>

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