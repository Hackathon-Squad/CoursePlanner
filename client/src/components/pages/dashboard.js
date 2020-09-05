import React, { useState, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import MaterialTable from "material-table";
import axios from "axios";
import moment from "moment";

const Dashboard = ({ userAuth, token }) => {
  const [tableData, setTableData] = useState({
    columns: [
      { title: "Name", field: "name" },
      { title: "Date Created", field: "createdDate", editable: "never" },
      {
        title: "Date Modified",
        field: "modifiedDate",
        editable: "never",
        defaultSort: "desc",
      },
    ],
    viewPlan: false,
    redirectURL: "",
  });

  useLayoutEffect(() => {
    if (userAuth) {
      loadTableData();
    }
  }, [userAuth]);

  const loadTableData = async () => {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };

    var coursePlanData = await axios
      .get("/api/coursePlan/allPlansByID", config)
      .catch((err) => console.error(err));
    var coursePlanIDObjects = coursePlanData.data;
    var allIDs = [];
    coursePlanIDObjects.forEach((planID) => {
      allIDs.push(planID._id);
    });

    var currentData = [];
    for (var i = 0; i < allIDs.length; i++) {
      var url = "/api/coursePlan/getPlan/" + allIDs[i];
      var planData = await axios
        .get(url, config)
        .catch((err) => console.error(err));

      currentData.push({
        name: planData.data[0].name,
        createdDate: moment(planData.data[0].createdDate).format(
          "MMMM Do, h:mm a"
        ),
        modifiedDate: moment(planData.data[0].modifiedDate).format(
          "MMMM Do, h:mm a"
        ),
        planID: planData.data[0]._id,
      });
    }

    setTableData({
      ...tableData,
      data: currentData,
    });

    return currentData;
  };

  const deletePlan = async (rowData) => {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    var url = "/api/coursePlan/deletePlan/" + rowData.planID;
    await axios.delete(url, config).catch((err) => console.error(err));
    loadTableData();
  };

  const addPlan = async (newData) => {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    var url = "/api/coursePlan/createPlan";
    var newPlanID;
    await axios
      .put(url, config)
      .then((result) => {
        newPlanID = result.data;
      })
      .catch((err) => console.error(err));

    const updateConfig = {
      headers: {
        "x-auth-token": token,
        "Content-Type": "application/json",
      },
    };

    const body = JSON.stringify({ name: newData.name });
    console.log(newPlanID);
    var updateURL = "/api/coursePlan/updatePlan/" + newPlanID;
    await axios
      .post(updateURL, body, updateConfig)
      .then(loadTableData())
      .catch((err) => console.error(err));
  };

  const viewPlan = async (rowData) => {
    const config = {
      headers: {
        "x-auth-token": token,
        "Content-Type": "application/json",
      },
    };
    var url = "/api/coursePlan/updatePlan/" + rowData.planID;
    var currentTime = moment().toISOString();
    var body = JSON.stringify({ modifiedDate: currentTime });

    await axios.post(url, body, config).catch((err) => console.error(err));
    var newURL = "/plan/" + rowData.planID;
    setTableData({ ...tableData, viewPlan: true, redirectURL: newURL });
  };

  if (!userAuth) {
    return <Redirect to="/" />;
  }

  if (tableData.viewPlan) {
    return <Redirect to={tableData.redirectURL} />;
  }

  return (
    <div id="myBackground">
      <div className="table">
        <MaterialTable
          title="Course Plans"
          columns={tableData.columns}
          data={tableData.data}
          options={{
            headerStyle: {
              fontSize: 22,
            },
            rowStyle: {
              fontSize: 20,
            },
            tableLayout: "auto",
            draggable: false,
          }}
          actions={[
            {
              icon: "edit",
              tooltip: "View and Edit course plan",
              onClick: (event, rowData) => viewPlan(rowData),
            },
          ]}
          editable={{
            onRowDelete: (oldData) => deletePlan(oldData),
            onRowAdd: (newData) => addPlan(newData),
          }}
        />
      </div>
    </div>
  );
};
Dashboard.propTypes = {
  token: PropTypes.string,
  userAuth: PropTypes.bool,
};

const stateToProps = (state) => ({
  userAuth: state.authReducer.userAuth,
  token: state.authReducer.token,
});

export default connect(stateToProps)(Dashboard);
