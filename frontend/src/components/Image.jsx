import React from 'react';

const Image = ({ image }) => {
    return (
        <div class="h-1/8 flex justify-center">
            <div class="w-1/2 flex flex-col justify-center">
                <button class="h-1/2 bg-white">
                    <image src={image}>

                    </image>
                </button>
            </div>
        </div>
    );
};

export default Image;