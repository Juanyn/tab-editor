import { DELETE_MEASURE, INSERT_MEASURE, REPLACE_SONG, CHANGE_TUNING,
  CHANGE_BPM, SET_INSTRUMENT, CHANGE_TIME_SIGNATURE, PASTE_NOTE, CUT_NOTE } from '../actions/types';
import measure from './measure';

const replaceMeasure = (state, action) => {
  if(!action.index) {
    return state;
  }

  return state.map((m, index) => {
    if(index === action.index.measureIndex) {
      return measure(m, action);
    }
    return m;
  });
};

const changeAllMeasures = (measures, bpm) => {
  return measures.map((measure) => ({
    ...measure,
    bpm
  }));
};

const changeMeasuresAfterCurrent = (measures, bpm, measureIndex) => {
  return measures.map((measure, i) => {
    if(measureIndex > i) {
      return measure;
    }
    return {
      ...measure,
      bpm
    };
  });
};

const changeTimeSigAllMeasures = (measures, timeSignature) => {
  return measures.map((measure) => ({
    ...measure,
    timeSignature
  }));
};

const changeTimeSigMeasuresAfterCurrent = (measures, timeSignature, measureIndex) => {
  return measures.map((measure, i) => {
    if(measureIndex > i) {
      return measure;
    }
    return {
      ...measure,
      timeSignature
    };
  });
};

export default function track(state = {}, action) {
  switch(action.type) {
    case DELETE_MEASURE:
      return {
        ...state,
        measures: state.measures.filter((_, index) => index !== action.measureIndex)
      };

    case INSERT_MEASURE: {
      const lastMeasure = state.measures[state.measures.length - 1];

      return {
        ...state,
        measures: state.measures.concat({
          timeSignature: lastMeasure.timeSignature,
          bpm: lastMeasure.bpm,
          notes: []
        })
      };
    }

    case REPLACE_SONG:
      return action.track;

    case SET_INSTRUMENT:
      return Object.assign({}, state, { instrument: action.instrument });

    case CHANGE_TUNING:
      return Object.assign({}, state, { tuning: action.tuning });

    case CHANGE_BPM: {
      const newMeasures = action.all ? changeAllMeasures(state.measures, action.bpm)
                                   : changeMeasuresAfterCurrent(state.measures, action.bpm, action.index.measureIndex);
      return {
        ...state,
        measures: newMeasures
      };
    }

    case CHANGE_TIME_SIGNATURE: {
      const { timeSignature, index } = action;
      const newMeasures = action.all ? changeTimeSigAllMeasures(state.measures, timeSignature)
                                   : changeTimeSigMeasuresAfterCurrent(state.measures, timeSignature, index.measureIndex);
      return {
        ...state,
        measures: newMeasures
      };
    }

    case PASTE_NOTE: {
      const { index, clipboard } = action;

      if(Array.isArray(clipboard)) {
        const measures = state.measures.slice(0, index.measureIndex + 1).concat(clipboard).concat(state.measures.slice(index.measureIndex + 1, state.measures.length));
        return {
          ...state,
          measures
        };
      } else {
        return {
          ...state,
          measures: replaceMeasure(state.measures, action)
        };
      }
    }

    case CUT_NOTE: {
      const { selection, range } = action;

      if(!selection) {
        return {
          ...state,
          measures: state.measures.filter((_, index) => index !== action.index.measureIndex)
        };
      } else if(Array.isArray(selection)) {
        const mappedMeasures = state.measures.map((measure, i) => {
          if(range[i]) {
            if(range[i] !== 'all') {
              const notes = measure.notes.filter((_, j) => {
                return range[i].indexOf(j) === -1;
              });
              return {
                ...measure,
                notes
              };
            }
          }
          return measure;
        });

        const filteredMeasures = mappedMeasures.filter((measure, i) => {
          if(range[i]) {
            if(range[i] === 'all') {
              return false;
            }
          }
          return measure.notes.length;
        });

        return {
          ...state,
          measures: filteredMeasures
        };
      } else {
        return {
          ...state,
          measures: replaceMeasure(state.measures, action)
        };
      }
    }

    default:
      return {
        measures: replaceMeasure(state.measures, action),
        tuning: state.tuning,
        instrument: state.instrument
      };
  }
}
