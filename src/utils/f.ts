type testUtilFuncProps = {
  someInput: string;
  anotherInput: number;
};

/**
 * Function to test the inputs
 * @param {testUtilFuncProps} props - The input properties
 * @param {string} props.someInput - The first input
 * @param {number} props.anotherInput - The second input
 */

export const testUtilFunc = ({
  someInput,
  anotherInput,
}: testUtilFuncProps) => {
  console.log("test is run");
};
