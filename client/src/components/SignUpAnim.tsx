import Lottie from 'react-lottie';
import signUpAnimData from '../assets/jsonFiles/signUpAnim.json';

const SignUpAnim = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: signUpAnimData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    // We use 'pointer-events-none' so the animation doesn't block clicks
    <div className="pointer-events-none flex justify-center items-center w-full">
      <Lottie 
        options={defaultOptions} 
        height="100%" 
        width="100%" 
        isClickToPauseDisabled={true}
      />
    </div>
  );
};

export default SignUpAnim;