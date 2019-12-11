import Orders from "../components/Orders";
import PleaseSignIn from "../components/PleaseSignIn";

const OrderPage = props => (
  <div>
    <PleaseSignIn>
      <Orders />
    </PleaseSignIn>
  </div>
);

export default OrderPage;
