import { LocaleProvider } from "./locale-provider";
import { HomeView } from "./home-view";

export default function Home() {
  return (
    <LocaleProvider>
      <HomeView />
    </LocaleProvider>
  );
}
