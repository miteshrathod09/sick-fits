import React from "react";
import styled from "styled-components";

import SignUp from "../components/SignUp";
import SignIn from "../components/SignIn";
import RequestReset from "../components/RequestReset";

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 20px;
`;

export default function signup() {
  return (
    <Columns>
      <SignUp />
      <SignIn />
      <RequestReset />
    </Columns>
  );
}
