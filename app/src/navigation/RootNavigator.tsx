import React from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import Tabs from "./Tabs";

export default function RootNavigator() {
  const { user, isUserFetched, onboardingCompleted } = useAppContext();

  if (!user) {
    return isUserFetched ? <LoginScreen /> : <Loading />;
  }
  if (!onboardingCompleted) {
    return <OnboardingScreen />;
  }
  return <Tabs />;
}
