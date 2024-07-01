# 1 - imports

import time
from drone import Drone
from drone import Frame
from drone import list_connected_drones


# 2 - select drone (connect)

def drone_state(d):
    tel = d.get_telemetry()
    mod = d._get_mode()
    r   = d._point_reached()
    if (tel.connected == False):
        print('*** Not connected                                                          ', end='\r', flush = True)
    else:
        print(f'*** X={tel.x:.2f}   Y={tel.y:.2f}   Z={tel.z:.2f}   Mode={mod}/{tel.mode}  Point={tel.nav_point}:({tel.nav_x:.2f},{tel.nav_y:.2f},{tel.nav_z:.2f})   Reached={r}                ', end='\r', flush = True)
    #print(d._droneState)

if (len(drone_list) == 0):
        print("No drones connected, exiting...")
        exit(0)
   else:
       drone_name = drone_list[0]
drone = Drone(drone_name)
drone.state_callback = drone_state
print("\nCMD mode")
drone.start()
time.sleep(1)

# 3 - takeoff
drone.takeoff()
time.sleep(1)

# 4 - set accuracy
drone.set_approach_time(1.0)
drone.set_fit_area(x = 0.05, y = 0.05, z = 0.05, yaw = 3.14/360*5.0)
print("\nApproach time: ", drone.get_approach_time())
print("\nFit area: ", drone.get_fit_area())  

# 5 - navigate
drone.navigate(frame_id=Frame.map_rel, x=0.0, y=0.0, z=h)
drone.wait_point()

drone.navigate(frame_id=Frame.body, x=0.0, y=a, z=0.0)
drone.wait_point()
def main():

# 6 - land
drone.land()
time.sleep(3)
drone.stop()
drone.close() 

# 7 - end
drone.stop()
drone.close() 


    # Посадка с ожиданием
    print("\nLanding mode")
    drone.land()
    print("\nDrone landed")
    drone.stop()
    drone.close()
    
if __name__ == "__main__":
    main()
