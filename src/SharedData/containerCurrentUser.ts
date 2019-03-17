import { UserWithToken, ApiAuth, Api } from "../api"
import { ERTSContainer } from "../ERTS/ERTS-Container"

/*

-- STATE

*/

interface StateLoading {
    type: "Loading"
}
interface StateLoaded {
    type: "Loaded"
    currentUser: UserWithToken | null
}
type CurrentUser = StateLoading | StateLoaded

export const containerCurrentUser = new ERTSContainer<CurrentUser>({ type: "Loading" })
