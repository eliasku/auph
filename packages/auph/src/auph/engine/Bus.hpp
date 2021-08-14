#pragma once

namespace auph {

struct BusObj {
    int id = 0;
    int state = Flag_Running | Flag_Active;
    int gain = Unit;

    [[nodiscard]] float get() const {
        return (state & Flag_Running) ? (static_cast<float>(gain) / Unit) : 0.0f;
    }
};

}